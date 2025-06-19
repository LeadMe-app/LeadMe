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
import matplotlib.font_manager as fm
import io
import soundfile as sf

# 기존 LeadMe 모듈 임포트
from services.openai_stt import OpenAISTTService

warnings.filterwarnings('ignore')

# 로깅 설정
logger = logging.getLogger(__name__)

# 한글 폰트 경로 등록
font_path = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
font_prop = fm.FontProperties(fname=font_path)
plt.rcParams['font.family'] = font_prop.get_name()
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

        temp_file_path = None
        try:
            # 1. 바이트 데이터를 임시 파일로 저장
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name

            # 2. 임시 파일에서 음성 로드
            y, sr = librosa.load(temp_file_path, sr=None)
            total_duration = librosa.get_duration(y=y, sr=sr)

            if total_duration < 60:
                return {
                    "status": "error",
                    "error": "분석을 위해서는 최소 1분 이상의 음성이 필요합니다."
                }

            logger.info(f"총 길이: {total_duration:.2f}초")

            # 3. 12구간으로 균등 분할
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

            # 4. 전기/중기/말기 SPM 계산 (4구간씩)
            early_segments = segments[0:4]  # 1-4구간
            middle_segments = segments[4:8]  # 5-8구간
            late_segments = segments[8:12]  # 9-12구간

            early_spm = self._calculate_average_spm(early_segments)
            middle_spm = self._calculate_average_spm(middle_segments)
            late_spm = self._calculate_average_spm(late_segments)
            overall_spm = self._calculate_average_spm(segments)

            # 5. 하이퍼볼릭 모델 피팅
            model_result = self.fit_hyperbolic_model(segments)

            # 6. 그래프 생성 (Base64)
            graph_result = self.create_analysis_graph(segments, model_result,
                                                      early_spm, middle_spm, late_spm, overall_spm)

            # 7. 최종 결과 구성
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
                    "early_spm": early_spm,
                    "middle_spm": middle_spm,
                    "late_spm": late_spm,
                    "overall_spm": overall_spm,
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

            # 8. 최종 결과 반환
            logger.info("=== 분석 완료 ===")
            logger.info(f"전기 SPM: {early_spm}, 중기 SPM: {middle_spm}, 말기 SPM: {late_spm}")
            logger.info(f"전체 SPM: {overall_spm}")

            return final_result

        except Exception as e:
            logger.error(f"분석 실패: {e}")
            return {"status": "error", "error": str(e)}

        finally:
            # 임시 파일 정리
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info("임시 파일 삭제 완료")
                except Exception as cleanup_error:
                    logger.warning(f"임시 파일 정리 중 오류: {cleanup_error}")

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
                sf.write(temp_audio_path, segment_audio, sr)
                stt_result = self.stt_service.speech_to_text(temp_audio_path)

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
        """개선된 음성 피로도 분석 그래프 생성 (Base64 인코딩)"""
        try:
            # 그래프 생성 (큰 단일 그래프)
            plt.figure(figsize=(14, 8))

            # 유효한 구간 데이터 추출 (키 이름 호환성 확보)
            valid_segments = []
            for s in segments:
                if s.get("is_valid", False):
                    # segment_number 또는 segment_num 키 확인
                    segment_num = s.get("segment_number") or s.get("segment_num")
                    if segment_num is not None:
                        valid_segments.append({
                            "segment_number": segment_num,
                            "spm": s.get("spm", 0),
                            "is_valid": s.get("is_valid", False)
                        })

            if not valid_segments:
                logger.warning("유효한 구간이 없습니다.")
                return {"status": "error", "error": "유효한 구간이 없습니다."}

            # 구간 번호와 SPM 값 추출
            segment_nums = [s["segment_number"] for s in valid_segments]
            all_spms = [s["spm"] for s in valid_segments]

            # 메인 그래프 생성
            ax = plt.gca()

            # 전기/중기/말기 구간 배경색으로 표시
            ax.axvspan(0.5, 4.5, alpha=0.15, color='lightblue', label='전기 구간 (1-4)')
            ax.axvspan(4.5, 8.5, alpha=0.15, color='lightgreen', label='중기 구간 (5-8)')
            ax.axvspan(8.5, 12.5, alpha=0.15, color='lightcoral', label='말기 구간 (9-12)')

            # SPM 데이터 플롯
            ax.plot(segment_nums, all_spms, 'bo-', markersize=8, linewidth=3,
                    label='관측된 SPM', markerfacecolor='lightblue', markeredgecolor='blue')

            # 하이퍼볼릭 모델 라인 추가 (있는 경우)
            if model_result and model_result.get("model_fitted"):
                try:
                    # 모델 예측값 계산
                    times = np.array(segment_nums)
                    params = model_result["parameters"]
                    spm0 = params["spm0"]
                    di = params["decline_index"]
                    b = params["shape_parameter"]

                    # 더 부드러운 곡선을 위해 세밀한 시간 포인트 생성
                    smooth_times = np.linspace(min(segment_nums), max(segment_nums), 100)
                    model_spms = self.hyperbolic_decline_model(smooth_times, spm0, di, b)

                    ax.plot(smooth_times, model_spms, 'r--', linewidth=2, alpha=0.7,
                            label='하이퍼볼릭 모델')
                except Exception as e:
                    logger.warning(f"모델 곡선 그리기 실패: {e}")

            # 그래프 제목 및 라벨 (한글)
            plt.title('12구간별 SPM 변화 분석', fontsize=18, fontweight='bold', pad=20, fontproperties=font_prop)
            plt.xlabel('구간 번호', fontsize=14, fontproperties=font_prop)
            plt.ylabel('SPM (음절/분)', fontsize=14, fontproperties=font_prop)


            # 축 설정
            plt.xlim(0.5, 12.5)
            plt.xticks(range(1, 13))

            # Y축 범위를 데이터에 맞게 조정
            if all_spms:
                y_min = max(0, min(all_spms) - 10)
                y_max = max(all_spms) + 10
                plt.ylim(y_min, y_max)

            # 격자 추가
            plt.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)

            # 범례 추가
            plt.legend(loc='upper right', fontsize=10)

            # 분석 결과 텍스트 박스 추가 (한글)
            decline_rate = ((early_spm - late_spm) / early_spm * 100) if early_spm > 0 else 0
            fatigue_status = "피로 감지됨" if decline_rate > 5 else "안정적 발화"

            textstr = f'''분석 결과
    - 전기 평균: {early_spm:.1f} SPM
    - 중기 평균: {middle_spm:.1f} SPM  
    - 말기 평균: {late_spm:.1f} SPM
    - 전체 평균: {overall_spm:.1f} SPM
    - 변화율: {decline_rate:.1f}%
    - 유효 구간: {len(valid_segments)}/12개
    - 결과: {fatigue_status}'''

            # 텍스트 박스 위치 (좌상단)
            props = dict(boxstyle='round,pad=0.8', facecolor='wheat', alpha=0.9, edgecolor='gray')
            plt.text(0.02, 0.98, textstr, transform=ax.transAxes, fontsize=11,
                     verticalalignment='top', bbox=props, fontproperties=font_prop)

            # 모델 정보 추가 (우하단)
            if model_result and model_result.get("model_fitted"):
                model_params = model_result["parameters"]
                model_quality = model_result["model_quality"]

                model_textstr = f'''모델 정보
    - 초기 SPM: {model_params["spm0"]:.1f}
    - 감소 지수: {model_params["decline_index"]:.4f}
    - 형태 매개변수: {model_params["shape_parameter"]:.2f}
    - R² 값: {model_quality["r_squared"]:.3f}'''

                model_props = dict(boxstyle='round,pad=0.5', facecolor='lightblue', alpha=0.8)
                plt.text(0.98, 0.02, model_textstr, transform=ax.transAxes, fontsize=9,
                         verticalalignment='bottom', horizontalalignment='right', bbox=model_props, fontproperties=font_prop)

            # 레이아웃 조정
            plt.tight_layout()

            # Base64 인코딩
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight',
                        facecolor='white', edgecolor='none')
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
