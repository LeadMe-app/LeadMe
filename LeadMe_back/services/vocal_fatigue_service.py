# -*- coding: utf-8 -*-
"""
하이퍼볼릭 모델 기반 음성 피로 분석 서비스
"""

import os
import logging
import numpy as np
from scipy.optimize import curve_fit
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import librosa
import pandas as pd
import base64
import warnings
import matplotlib.pyplot as plt
import io

# 기존 LeadMe 모듈 임포트
from services.openai_stt import OpenAISTTService

warnings.filterwarnings('ignore')

# 로깅 설정
logger = logging.getLogger(__name__)

# 한글 폰트 설정
plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False


class VocalFatigueAnalysisService:
    """하이퍼볼릭 모델을 사용한 음성 피로 분석 서비스"""

    def __init__(self):
        """분석 서비스 초기화"""
        self.stt_service = OpenAISTTService()
        self.analysis_results = []

    def hyperbolic_decline_model(self, t: np.ndarray, spm0: float, di: float, b: float) -> np.ndarray:
        """
        하이퍼볼릭 감소 모델
        SPM(t) = SPM₀ / (1 + b·Di·t)^(1/b)
        """
        denominator = 1 + b * di * t
        denominator = np.maximum(denominator, 1e-10)
        return spm0 / (denominator ** (1 / b))

    def calculate_initial_decline_rate(self, spm0: float, spm1: float, dt: float) -> float:
        """초기 감소율 계산"""
        if spm0 == 0 or dt == 0:
            return 0.01
        return abs(spm0 - spm1) / (spm0 * dt)

    def analyze_audio_file_12segments(self, audio_data: bytes, user_id: str = None,
                                      save_to_db: bool = False) -> Dict:
        """
        업로드된 음성 데이터를 12구간으로 분할하여 분석

        Args:
            audio_data: 음성 파일 바이트 데이터
            user_id: 사용자 ID
            save_to_db: 데이터베이스 저장 여부

        Returns:
            전체 분석 결과
        """
        logger.info("=== 12구간 분할 음성 피로 분석 시작 ===")

        try:
            # 1. 바이트 데이터에서 음성 로드
            import io
            audio_buffer = io.BytesIO(audio_data)
            y, sr = librosa.load(audio_buffer, sr=None)
            total_duration = librosa.get_duration(y=y, sr=sr)

            if total_duration < 60:
                return {
                    "status": "error",
                    "error": "분석을 위해서는 최소 1분 이상의 음성이 필요합니다."
                }

            logger.info(f"총 길이: {total_duration:.2f}초")

            # 2. 12구간으로 균등 분할
            segment_duration = total_duration / 12
            segments = []

            for i in range(12):
                start_time = i * segment_duration
                end_time = (i + 1) * segment_duration

                # 해당 구간의 오디오 추출
                start_sample = int(start_time * sr)
                end_sample = int(end_time * sr)
                segment_audio = y[start_sample:end_sample]

                # 구간별 SPM 계산
                segment_result = self.analyze_audio_segment(
                    segment_audio, sr, start_time, end_time, i + 1
                )
                segments.append(segment_result)

                logger.info(f"구간 {i + 1}/12: {start_time:.1f}-{end_time:.1f}초, SPM: {segment_result['spm']}")

            # 3. 전기/중기/말기 SPM 계산 (4구간씩)
            early_segments = segments[0:4]  # 1-4구간
            middle_segments = segments[4:8]  # 5-8구간
            late_segments = segments[8:12]  # 9-12구간

            early_spm = self._calculate_average_spm(early_segments)
            middle_spm = self._calculate_average_spm(middle_segments)
            late_spm = self._calculate_average_spm(late_segments)
            overall_spm = self._calculate_average_spm(segments)

            # 4. 하이퍼볼릭 모델 피팅
            model_result = self.fit_hyperbolic_model(segments)

            # 5. 그래프 생성 (Base64)
            graph_result = self.create_analysis_graph(segments, model_result,
                                                      early_spm, middle_spm, late_spm, overall_spm)

            # 6. 최종 결과 구성
            final_result = {
                "status": "success",
                "analysis_type": "12_segment_vocal_fatigue",
                "timestamp": datetime.now().isoformat(),
                "audio_info": {
                    "total_duration": total_duration,
                    "segment_count": 12,
                    "segment_duration": segment_duration,
                    "valid_segments": len([s for s in segments if s["is_valid"]])
                },
                "spm_analysis": {
                    "early_spm": early_spm,  # 전기 (1-4구간)
                    "middle_spm": middle_spm,  # 중기 (5-8구간)
                    "late_spm": late_spm,  # 말기 (9-12구간)
                    "overall_spm": overall_spm,  # 전체
                    "decline_early_to_late": round(((early_spm - late_spm) / early_spm * 100),
                                                   1) if early_spm > 0 else 0
                },
                "segments": segments,
                "graph_image": graph_result.get("image_base64"),
                "graph_available": graph_result.get("status") == "success"
            }

            # 모델 결과가 있으면 추가
            if model_result:
                final_result.update(model_result)

            # 7. 최종 결과 반환
            logger.info("=== 분석 완료 ===")
            logger.info(f"전기 SPM: {early_spm}, 중기 SPM: {middle_spm}, 말기 SPM: {late_spm}")
            logger.info(f"전체 SPM: {overall_spm}")

            return final_result

        except Exception as e:
            logger.error(f"분석 실패: {e}")
            return {"status": "error", "error": str(e)}

    def analyze_audio_segment(self, segment_audio: np.ndarray, sr: int,
                              start_time: float, end_time: float, segment_num: int) -> Dict:
        """개별 구간 SPM 분석"""
        try:
            duration = end_time - start_time

            # 음성 구간 검출
            frames = librosa.effects.split(segment_audio, top_db=20)
            voiced_duration = sum(f[1] - f[0] for f in frames) / sr if len(frames) > 0 else 0
            voiced_percentage = (voiced_duration / duration) * 100 if duration > 0 else 0

            # STT를 통한 음절 수 계산
            temp_audio_path = f"temp_segment_{segment_num}.wav"
            try:
                librosa.output.write_wav(temp_audio_path, segment_audio, sr)
                stt_result = self.stt_service.transcribe_audio(temp_audio_path)

                if stt_result["status"] == "success":
                    text = stt_result["text"]
                    syllables_count = self.stt_service.count_korean_syllables(text)
                else:
                    # STT 실패 시 추정값 사용
                    syllables_count = int(voiced_duration * 4.5)

                os.remove(temp_audio_path)
            except Exception as e:
                # 예외 발생 시 추정값 사용
                syllables_count = int(voiced_duration * 4.5)
                logger.warning(f"구간 {segment_num} STT 처리 중 오류: {e}")

            # SPM 계산
            spm = int(syllables_count / duration * 60) if duration > 0 else 0

            return {
                "segment_num": segment_num,
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "voiced_duration": voiced_duration,
                "voiced_percentage": voiced_percentage,
                "syllables_count": syllables_count,
                "spm": spm,
                "is_valid": spm > 0 and voiced_percentage > 10
            }

        except Exception as e:
            logger.error(f"구간 {segment_num} 분석 실패: {e}")
            return {
                "segment_num": segment_num,
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "voiced_duration": 0,
                "voiced_percentage": 0,
                "syllables_count": 0,
                "spm": 0,
                "is_valid": False,
                "error": str(e)
            }

    def _calculate_average_spm(self, segments: List[Dict]) -> float:
        """유효한 구간들의 평균 SPM 계산"""
        valid_spms = [s["spm"] for s in segments if s["is_valid"] and s["spm"] > 0]
        return round(sum(valid_spms) / len(valid_spms), 1) if valid_spms else 0

    def fit_hyperbolic_model(self, segments: List[Dict]) -> Optional[Dict]:
        """하이퍼볼릭 모델 피팅"""
        try:
            # 유효한 데이터만 추출
            valid_segments = [s for s in segments if s["is_valid"]]
            if len(valid_segments) < 4:
                return None

            # 시간 및 SPM 데이터 준비
            times = np.array([s["start_time"] / 60 for s in valid_segments])  # 분 단위로 변환
            spms = np.array([s["spm"] for s in valid_segments])

            # 초기 파라미터 추정
            spm0_init = spms[0] if len(spms) > 0 else 200
            di_init = self.calculate_initial_decline_rate(spms[0], spms[1], times[1] - times[0]) if len(
                spms) > 1 else 0.01
            b_init = 1.0

            # 모델 피팅
            try:
                popt, pcov = curve_fit(
                    self.hyperbolic_decline_model,
                    times, spms,
                    p0=[spm0_init, di_init, b_init],
                    bounds=([50, 0.001, 0.1], [500, 1.0, 5.0]),
                    maxfev=2000
                )

                spm0_fitted, di_fitted, b_fitted = popt

                # R² 계산
                y_pred = self.hyperbolic_decline_model(times, *popt)
                ss_res = np.sum((spms - y_pred) ** 2)
                ss_tot = np.sum((spms - np.mean(spms)) ** 2)
                r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

                return {
                    "model_fitted": True,
                    "parameters": {
                        "spm0": round(spm0_fitted, 2),
                        "decline_index": round(di_fitted, 4),
                        "shape_parameter": round(b_fitted, 2)
                    },
                    "model_quality": {
                        "r_squared": round(r_squared, 3),
                        "fitting_status": "success"
                    }
                }

            except Exception as e:
                logger.warning(f"모델 피팅 실패: {e}")
                return {
                    "model_fitted": False,
                    "fitting_status": "failed",
                    "error": str(e)
                }

        except Exception as e:
            logger.error(f"하이퍼볼릭 모델 피팅 중 오류: {e}")
            return None

    def create_analysis_graph(self, segments: List[Dict], model_result: Optional[Dict],
                              early_spm: float, middle_spm: float, late_spm: float, overall_spm: float) -> Dict:
        """분석 결과 그래프 생성 (Base64 인코딩)"""
        try:
            # 그래프 생성
            plt.figure(figsize=(12, 8))

            # 유효한 구간 데이터 추출
            valid_segments = [s for s in segments if s["is_valid"]]
            segment_nums = [s["segment_num"] for s in valid_segments]
            spms = [s["spm"] for s in valid_segments]

            # 1. SPM 시계열 플롯
            plt.subplot(2, 2, 1)
            plt.plot(segment_nums, spms, 'bo-', linewidth=2, markersize=6, label='실제 SPM')

            # 하이퍼볼릭 모델 피팅 결과가 있으면 표시
            if model_result and model_result.get("model_fitted"):
                times = np.array([s["start_time"] / 60 for s in valid_segments])
                model_spms = self.hyperbolic_decline_model(
                    times,
                    model_result["parameters"]["spm0"],
                    model_result["parameters"]["decline_index"],
                    model_result["parameters"]["shape_parameter"]
                )
                plt.plot(segment_nums, model_spms, 'r--', linewidth=2, label='하이퍼볼릭 모델')
                plt.legend()

            plt.title('구간별 발화 속도 (SPM) 변화')
            plt.xlabel('구간 번호')
            plt.ylabel('SPM')
            plt.grid(True, alpha=0.3)

            # 2. 전기/중기/말기 비교
            plt.subplot(2, 2, 2)
            periods = ['전기\n(1-4구간)', '중기\n(5-8구간)', '말기\n(9-12구간)']
            period_spms = [early_spm, middle_spm, late_spm]
            colors = ['lightblue', 'lightgreen', 'lightcoral']

            bars = plt.bar(periods, period_spms, color=colors, alpha=0.7)
            for bar, spm in zip(bars, period_spms):
                plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 5,
                         f'{spm:.1f}', ha='center', va='bottom', fontweight='bold')

            plt.title('시기별 평균 SPM 비교')
            plt.ylabel('SPM')
            plt.ylim(0, max(period_spms) * 1.2)

            # 3. 음성 구간 비율
            plt.subplot(2, 2, 3)
            voiced_percentages = [s["voiced_percentage"] for s in valid_segments]
            plt.plot(segment_nums, voiced_percentages, 'go-', linewidth=2, markersize=6)
            plt.title('구간별 음성 비율')
            plt.xlabel('구간 번호')
            plt.ylabel('음성 비율 (%)')
            plt.grid(True, alpha=0.3)

            # 4. 분석 요약 텍스트
            plt.subplot(2, 2, 4)
            plt.axis('off')

            summary_text = f"""
분석 요약

• 전체 평균 SPM: {overall_spm:.1f}
• 전기 SPM: {early_spm:.1f}
• 중기 SPM: {middle_spm:.1f}
• 말기 SPM: {late_spm:.1f}

• 변화율: {((early_spm - late_spm) / early_spm * 100) if early_spm > 0 else 0:.1f}%
• 유효 구간: {len(valid_segments)}/12개
            """

            if model_result and model_result.get("model_fitted"):
                summary_text += f"\n• 모델 R²: {model_result['model_quality']['r_squared']:.3f}"

            plt.text(0.1, 0.9, summary_text, fontsize=11, verticalalignment='top',
                     bbox=dict(boxstyle="round,pad=0.3", facecolor="lightgray", alpha=0.8))

            plt.tight_layout()

            # Base64 인코딩
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            plt.close()

            return {
                "status": "success",
                "image_base64": image_base64,
                "format": "png"
            }

        except Exception as e:
            logger.error(f"그래프 생성 실패: {e}")
            return {"status": "error", "error": str(e)} 
