# -*- coding: utf-8 -*-
"""
하이퍼볼릭 모델 기반 음성 피로 분석기 (수정버전)
업로드된 파일을 12구간으로 나누어 전기/중기/말기 SPM 분석
"""

import os
import sys
import tempfile
import shutil
import logging
import numpy as np
from scipy.optimize import curve_fit
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import librosa
import pandas as pd
import io
import base64
import warnings

# 기존 LeadMe 모듈 임포트
from services.openai_stt import OpenAISTTService
from database import get_db, SessionLocal
import models

warnings.filterwarnings('ignore')

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import matplotlib.pyplot as plt
# 기본 폰트를 영문 폰트로 설정
plt.rcParams['font.family'] = 'Malgun Gothic'  # 또는 'NanumGothic'
plt.rcParams['axes.unicode_minus'] = False


class HyperbolicVocalFatigueAnalyzer:
    """하이퍼볼릭 모델을 사용한 음성 피로 분석기 (수정버전)"""

    def __init__(self):
        """분석기 초기화"""
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

    def analyze_uploaded_audio_12segments(self, audio_file_path: str, user_id: str = None,
                                          save_to_db: bool = False) -> Dict:
        """
        업로드된 음성 파일을 12구간으로 분할하여 분석

        Args:
            audio_file_path: 업로드된 음성 파일 경로
            user_id: 사용자 ID
            save_to_db: 데이터베이스 저장 여부

        Returns:
            전체 분석 결과
        """
        logger.info("=== 12구간 분할 음성 피로 분석 시작 ===")

        try:
            # 1. 음성 파일 로드
            y, sr = librosa.load(audio_file_path, sr=None)
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

            # 7. 데이터베이스 저장 (선택사항)
            if save_to_db and user_id:
                self.save_analysis_to_database(user_id, final_result)

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

            # 음성 구간 검출 (기존 방식)
            frames = librosa.effects.split(segment_audio, top_db=20)
            voiced_duration = sum(f[1] - f[0] for f in frames) / sr if len(frames) > 0 else 0
            voiced_percentage = (voiced_duration / duration) * 100 if duration > 0 else 0

            # 음절 추정 (4.5 음절/초 기준)
            syllables_estimate = int(voiced_duration * 4.5) if voiced_duration > 0 else 0

            # SPM 계산
            spm = int(syllables_estimate / duration * 60) if duration > 0 else 0

            return {
                "segment_number": segment_num,
                "start_time": round(start_time, 2),
                "end_time": round(end_time, 2),
                "duration": round(duration, 2),
                "voiced_duration": round(voiced_duration, 2),
                "voiced_percentage": round(voiced_percentage, 1),
                "syllables_estimate": syllables_estimate,
                "spm": spm,
                "is_valid": spm > 0 and voiced_percentage > 10
            }

        except Exception as e:
            logger.error(f"구간 {segment_num} 분석 오류: {e}")
            return self._empty_segment_result(start_time, end_time, segment_num)

    def _empty_segment_result(self, start_time: float, end_time: float, segment_num: int) -> Dict:
        """빈 구간 결과 생성"""
        return {
            "segment_number": segment_num,
            "start_time": start_time,
            "end_time": end_time,
            "duration": end_time - start_time,
            "voiced_duration": 0,
            "voiced_percentage": 0,
            "syllables_estimate": 0,
            "spm": 0,
            "is_valid": False
        }

    def _calculate_average_spm(self, segments: List[Dict]) -> float:
        """구간들의 평균 SPM 계산 (유효한 구간만)"""
        valid_segments = [s for s in segments if s["is_valid"] and s["spm"] > 0]
        if not valid_segments:
            return 0.0

        total_spm = sum(s["spm"] for s in valid_segments)
        return round(total_spm / len(valid_segments), 1)

    def fit_hyperbolic_model(self, segments: List[Dict]) -> Optional[Dict]:
        """하이퍼볼릭 모델 피팅 (기존 로직 유지)"""
        try:
            valid_segments = [s for s in segments if s["is_valid"] and s["spm"] > 0]

            if len(valid_segments) < 3:
                logger.warning("하이퍼볼릭 모델 피팅에 충분한 데이터가 없습니다.")
                return None

            # 시간과 SPM 데이터 추출 (구간 번호 기준)
            time_points = np.array([s["segment_number"] for s in valid_segments])
            spm_values = np.array([s["spm"] for s in valid_segments])

            # 초기 추정값
            spm0_est = max(spm_values)
            di_est = self.calculate_initial_decline_rate(
                spm_values[0], spm_values[-1], time_points[-1] - time_points[0]
            ) if len(spm_values) > 1 else 0.01
            b_est = 0.5

            # 하이퍼볼릭 모델 피팅
            popt, pcov = curve_fit(
                self.hyperbolic_decline_model,
                time_points,
                spm_values,
                p0=[spm0_est, di_est, b_est],
                bounds=([50, 0.001, 0.1], [500, 1.0, 1.0]),
                maxfev=2000
            )

            spm0, di, b = popt

            # 모델 품질 평가
            predicted_spm = self.hyperbolic_decline_model(time_points, spm0, di, b)
            r_squared = self._calculate_r_squared(spm_values, predicted_spm)
            rmse = np.sqrt(np.mean((spm_values - predicted_spm) ** 2))

            logger.info(f"하이퍼볼릭 모델 피팅 완료 - R²: {r_squared:.3f}, b값: {b:.3f}")

            return {
                "model_type": "hyperbolic",
                "model_parameters": {
                    "spm0": float(spm0),
                    "initial_decline_rate": float(di),
                    "hyperbolic_exponent": float(b)
                },
                "model_quality": {
                    "r_squared": float(r_squared),
                    "rmse": float(rmse),
                    "data_points": len(valid_segments)
                },
                "time_points": time_points.tolist(),
                "observed_spm": spm_values.tolist(),
                "predicted_spm": predicted_spm.tolist()
            }

        except Exception as e:
            logger.error(f"하이퍼볼릭 모델 피팅 실패: {e}")
            return None

    def _fit_linear_model(self, time_points: np.ndarray, spm_values: np.ndarray,
                          valid_segments: List[Dict]) -> Optional[Dict]:
        """선형 모델 피팅 (하이퍼볼릭 모델이 적합하지 않을 때)"""
        try:
            # 선형 회귀
            A = np.vstack([time_points, np.ones(len(time_points))]).T
            slope, intercept = np.linalg.lstsq(A, spm_values, rcond=None)[0]

            predicted_spm = slope * time_points + intercept
            r_squared = self._calculate_r_squared(spm_values, predicted_spm)
            rmse = np.sqrt(np.mean((spm_values - predicted_spm) ** 2))

            # 변화량 및 안정성 분석
            spm_range = np.max(spm_values) - np.min(spm_values)
            spm_std = np.std(spm_values)

            # 피로도 지표 계산
            fatigue_indicators = {
                "total_decline_percentage": round(((spm_values[0] - spm_values[-1]) / spm_values[0] * 100), 1) if
                spm_values[0] > 0 else 0,
                "average_spm": round(np.mean(spm_values), 1),
                "spm_variability": round(spm_std, 1),
                "spm_range": round(spm_range, 1),
                "change_per_minute": round(slope * 60, 2),
                "interpretation": self._interpret_linear_change(slope, spm_std),
                "analysis_reason": f"SPM 변화량이 작아 선형 분석 적용 (범위: {spm_range:.1f}, 표준편차: {spm_std:.1f})"
            }

            logger.info(f"선형 모델 피팅 완료 - R²: {r_squared:.3f}, 기울기: {slope:.3f}")

            return {
                "model_type": "linear",
                "model_parameters": {
                    "slope": float(slope),
                    "intercept": float(intercept),
                    "change_per_minute": float(slope * 60)
                },
                "model_quality": {
                    "r_squared": float(r_squared),
                    "rmse": float(rmse),
                    "data_points": len(valid_segments)
                },
                "fatigue_indicators": fatigue_indicators,
                "time_points": time_points.tolist(),
                "observed_spm": spm_values.tolist(),
                "predicted_spm": predicted_spm.tolist(),
                "fallback_reason": "변화량이 적어 하이퍼볼릭 모델 대신 선형 모델 적용"
            }

        except Exception as e:
            logger.error(f"선형 모델 피팅도 실패: {e}")
            return None

    def _interpret_linear_change(self, slope: float, variability: float) -> str:
        """선형 변화 해석"""
        change_per_min = abs(slope * 60)

        if change_per_min < 2 and variability < 8:
            return "매우 안정적 - 일정한 발화 속도 유지"
        elif change_per_min < 5:
            if slope < 0:
                return "경미한 감소 - 약간의 피로 징후"
            else:
                return "경미한 증가 - 발화 속도 향상"
        elif change_per_min < 10:
            if slope < 0:
                return "중등도 감소 - 뚜렷한 피로 패턴"
            else:
                return "중등도 증가 - 워밍업 효과"
        else:
            if slope < 0:
                return "급격한 감소 - 심각한 피로"
            else:
                return "급격한 증가 - 비정상적 패턴"

    def _calculate_r_squared(self, observed: np.ndarray, predicted: np.ndarray) -> float:
        """결정계수(R²) 계산"""
        ss_res = np.sum((observed - predicted) ** 2)
        ss_tot = np.sum((observed - np.mean(observed)) ** 2)
        return 1 - (ss_res / ss_tot) if ss_tot > 0 else 0


    def create_analysis_graph(self, segments: List[Dict], model_result: Optional[Dict],
                              early_spm: float, middle_spm: float, late_spm: float,
                              overall_spm: float) -> Dict:
        """구간별 SPM 변화 그래프 (평균선 제거 버전)"""
        try:
            valid_segments = [s for s in segments if s["is_valid"]]
            segment_numbers = [s["segment_number"] for s in valid_segments]
            spm_values = [s["spm"] for s in valid_segments]

            fig, ax = plt.subplots(figsize=(12, 8))

            # 구간별 SPM 변화
            ax.plot(segment_numbers, spm_values, 'bo-', markersize=8, linewidth=3, label='관측된 SPM')

            # 하이퍼볼릭 모델이 있으면 추가
            if model_result and model_result.get("predicted_spm"):
                predicted_spm = model_result["predicted_spm"]
                model_type = model_result.get("model_type", "hyperbolic")

                if model_type == "hyperbolic":
                    color = 'r-'
                    label = '하이퍼볼릭 모델'
                else:
                    color = 'g--'
                    label = '선형 모델 (대체)'

                ax.plot(segment_numbers, predicted_spm, color, linewidth=2, label=label)

            # 전기/중기/말기 구간 배경색으로 표시
            ax.axvspan(1, 4, alpha=0.2, color='lightblue', label='전기 구간')
            ax.axvspan(5, 8, alpha=0.2, color='lightgreen', label='중기 구간')
            ax.axvspan(9, 12, alpha=0.2, color='lightcoral', label='말기 구간')



            # 축 설정
            ax.set_xlabel('구간 번호', fontsize=12)
            ax.set_ylabel('분당 음절 수 (SPM)', fontsize=12)
            ax.set_title('12구간별 SPM 변화 분석', fontsize=14, fontweight='bold')
            ax.grid(True, alpha=0.3)
            ax.set_xticks(range(1, 13))

            # 범례 설정
            ax.legend(loc='upper right', ncol=2, fontsize=10)

            # 평균값은 여전히 텍스트 박스에 표시
            fatigue_change = ((early_spm - late_spm) / early_spm * 100) if early_spm > 0 else 0

            info_text = f"""전기 평균: {early_spm:.1f} SPM
    중기 평균: {middle_spm:.1f} SPM
    말기 평균: {late_spm:.1f} SPM
    전체 평균: {overall_spm:.1f} SPM
    변화율: {fatigue_change:.1f}%
    결과: {'피로 감지됨' if fatigue_change > 5 else '안정적 발화'}"""

            ax.text(0.02, 0.98, info_text, transform=ax.transAxes, fontsize=11,
                    verticalalignment='top',
                    bbox=dict(boxstyle='round,pad=0.8', facecolor='white', alpha=0.9, edgecolor='gray'))

            plt.tight_layout()

            # 파일 저장 (기존과 동일)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"SPM분석_{timestamp}.png"

            graph_dir = "static/graphs"
            os.makedirs(graph_dir, exist_ok=True)
            file_path = os.path.join(graph_dir, filename)

            plt.savefig(file_path, format='png', dpi=300, bbox_inches='tight')
            plt.close()

            import urllib.parse
            encoded_filename = urllib.parse.quote(filename)
            graph_url = f"/static/graphs/{encoded_filename}"

            return {
                "graph_path": file_path,
                "graph_url": graph_url,
                "filename": filename,
                "status": "success"
            }

        except Exception as e:
            logger.error(f"그래프 생성 실패: {e}")
            return {"status": "error", "error": str(e)}



# 테스트용 메인 함수
def main():
    """테스트용 메인 함수"""
    analyzer = HyperbolicVocalFatigueAnalyzer()

    # 테스트용 음성 파일 경로
    test_audio_path = r"C:\Users\ckswn\Downloads\animalmeeting_01_ahn_64kb.wav"

    if os.path.exists(test_audio_path):
        try:
            result = analyzer.analyze_uploaded_audio_12segments(
                audio_file_path=test_audio_path,
                user_id="test_user",
                save_to_db=False
            )

            print("\n=== 12구간 분석 결과 ===")
            print(f"상태: {result['status']}")

            if result["status"] == "success":
                spm_analysis = result["spm_analysis"]
                print(f"전기 SPM: {spm_analysis['early_spm']}")
                print(f"중기 SPM: {spm_analysis['middle_spm']}")
                print(f"말기 SPM: {spm_analysis['late_spm']}")
                print(f"전체 SPM: {spm_analysis['overall_spm']}")
                print(f"변화율: {spm_analysis['decline_early_to_late']}%")
                print(f"그래프 생성: {result['graph_available']}")

        except Exception as e:
            print(f"분석 실패: {e}")
    else:
        print(f"테스트 파일을 찾을 수 없습니다: {test_audio_path}")


if __name__ == "__main__":
    main()
