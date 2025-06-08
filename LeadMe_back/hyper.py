# -*- coding: utf-8 -*-
"""
하이퍼볼릭 모델 기반 음성 피로 분석기
기존 LeadMe 기능들을 활용하여 긴 음성 파일의 SPM 변화를 분석
"""

import os
import sys
import tempfile
import shutil
import logging
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import librosa
import pandas as pd

# 기존 LeadMe 모듈 임포트
from services.openai_stt import OpenAISTTService
from database import get_db, SessionLocal
import models

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HyperbolicVocalFatigueAnalyzer:
    """하이퍼볼릭 모델을 사용한 음성 피로 분석기"""

    def __init__(self):
        """분석기 초기화"""
        self.stt_service = OpenAISTTService()
        self.analysis_results = []

    def hyperbolic_decline_model(self, t: np.ndarray, spm0: float, di: float, b: float) -> np.ndarray:
        """
        하이퍼볼릭 감소 모델
        SPM(t) = SPM₀ / (1 + b·Di·t)^(1/b)

        Args:
            t: 시간 배열
            spm0: 초기 음절 속도
            di: 초기 감소율
            b: 하이퍼볼릭 지수 (0 < b < 1)

        Returns:
            예측된 SPM 값 배열
        """
        # 0으로 나누기 방지
        denominator = 1 + b * di * t
        denominator = np.maximum(denominator, 1e-10)

        return spm0 / (denominator ** (1 / b))

    def calculate_initial_decline_rate(self, spm0: float, spm1: float, dt: float) -> float:
        """
        초기 감소율 계산
        Di = (SPM₀ - SPM₁) / (SPM₀ × Δt)

        Args:
            spm0: 시작 시점의 음절 속도
            spm1: 첫 번째 측정 구간의 음절 속도
            dt: 시간 간격

        Returns:
            초기 감소율
        """
        if spm0 <= 0 or dt <= 0:
            return 0.01  # 기본값

        return max(0.001, (spm0 - spm1) / (spm0 * dt))

    def analyze_audio_segment(self, segment_audio: np.ndarray, sr: int,
                              start_time: float, end_time: float) -> Dict:
        """
        개별 구간 분석 (기존 LeadMe 로직 활용)

        Args:
            segment_audio: 구간별 오디오 데이터
            sr: 샘플링 레이트
            start_time: 구간 시작 시간
            end_time: 구간 종료 시간

        Returns:
            구간 분석 결과
        """
        try:
            # 구간 길이 계산
            duration = end_time - start_time

            if duration <= 0:
                return self._empty_segment_result(start_time, end_time)

            # 음성 활성화 검출 (기존 LeadMe 로직)
            frames = librosa.effects.split(segment_audio, top_db=20)
            voiced_duration = sum(f[1] - f[0] for f in frames) / sr if len(frames) > 0 else 0

            # 음절 수 추정 (기존 LeadMe 방식)
            syllables_estimate = int(voiced_duration * 4.5)  # 한국어 평균 발화 속도

            # SPM 계산
            spm = int(syllables_estimate / duration * 60) if duration > 0 else 0

            # 음성 품질 지표 계산
            voiced_percentage = (voiced_duration / duration * 100) if duration > 0 else 0

            return {
                "start_time": round(start_time, 2),
                "end_time": round(end_time, 2),
                "duration": round(duration, 2),
                "voiced_duration": round(voiced_duration, 2),
                "voiced_percentage": round(voiced_percentage, 1),
                "syllables_estimate": syllables_estimate,
                "spm": spm,
                "is_valid": spm > 0 and voiced_percentage > 10  # 유효성 판단
            }

        except Exception as e:
            logger.error(f"구간 분석 오류 ({start_time}-{end_time}초): {e}")
            return self._empty_segment_result(start_time, end_time)

    def _empty_segment_result(self, start_time: float, end_time: float) -> Dict:
        """빈 구간 결과 생성"""
        return {
            "start_time": start_time,
            "end_time": end_time,
            "duration": end_time - start_time,
            "voiced_duration": 0,
            "voiced_percentage": 0,
            "syllables_estimate": 0,
            "spm": 0,
            "is_valid": False
        }

    def segment_long_audio(self, audio_file_path: str, segment_duration: float = 10.0) -> Dict:
        """
        긴 음성 파일을 구간별로 분석

        Args:
            audio_file_path: 음성 파일 경로
            segment_duration: 구간 길이 (초)

        Returns:
            구간별 분석 결과
        """
        try:
            logger.info(f"음성 파일 분석 시작: {audio_file_path}")

            # 전체 음성 파일 로드 (기존 LeadMe 방식)
            y, sr = librosa.load(audio_file_path, sr=None)
            total_duration = librosa.get_duration(y=y, sr=sr)

            logger.info(f"총 길이: {total_duration:.2f}초, 구간 길이: {segment_duration}초")

            # 1분 미만이면 전체 분석
            if total_duration < 60:
                logger.warning("1분 미만의 음성은 하이퍼볼릭 모델 적용이 어렵습니다.")
                return self._analyze_short_audio(y, sr, total_duration)

            segments = []
            segment_count = int(np.ceil(total_duration / segment_duration))

            # 구간별로 음성 분할 및 분석
            for i in range(segment_count):
                start_time = i * segment_duration
                end_time = min((i + 1) * segment_duration, total_duration)

                # 해당 구간의 오디오 추출
                start_sample = int(start_time * sr)
                end_sample = int(end_time * sr)
                segment_audio = y[start_sample:end_sample]

                # 구간별 분석
                segment_result = self.analyze_audio_segment(
                    segment_audio, sr, start_time, end_time
                )
                segments.append(segment_result)

                logger.info(f"구간 {i + 1}/{segment_count}: "
                            f"{start_time:.1f}-{end_time:.1f}초, SPM: {segment_result['spm']}")

            return {
                "status": "success",
                "total_duration": total_duration,
                "segment_duration": segment_duration,
                "segment_count": len(segments),
                "segments": segments,
                "valid_segments": [s for s in segments if s["is_valid"]]
            }

        except Exception as e:
            logger.error(f"구간별 분석 실패: {e}")
            return {"status": "error", "error": str(e)}

    def _analyze_short_audio(self, y: np.ndarray, sr: int, duration: float) -> Dict:
        """짧은 음성 파일 분석 (기존 방식)"""
        frames = librosa.effects.split(y, top_db=20)
        voiced_duration = sum(f[1] - f[0] for f in frames) / sr
        syllables_estimate = int(voiced_duration * 4.5)
        spm = int(syllables_estimate / duration * 60) if duration > 0 else 0

        return {
            "status": "short_audio",
            "total_duration": duration,
            "spm": spm,
            "message": "1분 미만의 음성은 단일 SPM 값으로 분석됩니다."
        }

    def fit_hyperbolic_model(self, segments: List[Dict]) -> Optional[Dict]:
        """
        하이퍼볼릭 모델을 실제 데이터에 피팅

        Args:
            segments: 구간별 분석 결과 리스트

        Returns:
            모델 파라미터 및 피팅 결과
        """
        try:
            # 유효한 구간만 필터링
            valid_segments = [s for s in segments if s["is_valid"] and s["spm"] > 0]

            if len(valid_segments) < 3:
                logger.warning("하이퍼볼릭 모델 피팅에 충분한 데이터가 없습니다.")
                return None

            # 시간과 SPM 데이터 추출
            time_points = np.array([s["start_time"] for s in valid_segments])
            spm_values = np.array([s["spm"] for s in valid_segments])

            # 데이터의 변화량 확인
            spm_range = np.max(spm_values) - np.min(spm_values)
            spm_std = np.std(spm_values)

            logger.info(f"SPM 데이터 분석 - 범위: {spm_range:.1f}, 표준편차: {spm_std:.1f}")

            # 변화량이 너무 작으면 선형 모델 사용
            if spm_range < 20 or spm_std < 8:
                logger.warning("SPM 변화량이 작아 하이퍼볼릭 모델보다 선형 분석이 적합합니다.")
                return self._fit_linear_model(time_points, spm_values, valid_segments)

            # 초기 추정값 계산
            spm0_est = max(spm_values)  # 최대값을 초기값으로 사용
            di_est = self.calculate_initial_decline_rate(
                spm_values[0], spm_values[-1],
                time_points[-1] - time_points[0]
            ) if len(spm_values) > 1 else 0.01
            b_est = 0.5

            logger.info(f"초기 추정값 - SPM0: {spm0_est}, Di: {di_est:.4f}, b: {b_est}")

            # 하이퍼볼릭 모델 피팅
            popt, pcov = curve_fit(
                self.hyperbolic_decline_model,
                time_points,
                spm_values,
                p0=[spm0_est, di_est, b_est],
                bounds=([50, 0.001, 0.1], [500, 1.0, 1.0]),  # 현실적인 범위로 제한
                maxfev=2000
            )

            spm0, di, b = popt

            # 모델 품질 평가
            predicted_spm = self.hyperbolic_decline_model(time_points, spm0, di, b)
            r_squared = self._calculate_r_squared(spm_values, predicted_spm)
            rmse = np.sqrt(np.mean((spm_values - predicted_spm) ** 2))

            # R²가 너무 낮으면 선형 모델로 폴백
            if r_squared < 0.3:
                logger.warning(f"하이퍼볼릭 모델 적합도 낮음 (R²={r_squared:.3f}), 선형 모델 사용")
                return self._fit_linear_model(time_points, spm_values, valid_segments)

            # 피로도 지표 계산
            fatigue_indicators = self._calculate_fatigue_indicators(
                spm_values, time_points, spm0, di, b
            )

            logger.info(f"하이퍼볼릭 모델 피팅 완료 - R²: {r_squared:.3f}, RMSE: {rmse:.1f}")

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
                "fatigue_indicators": fatigue_indicators,
                "time_points": time_points.tolist(),
                "observed_spm": spm_values.tolist(),
                "predicted_spm": predicted_spm.tolist()
            }

        except Exception as e:
            logger.error(f"하이퍼볼릭 모델 피팅 실패: {e}")
            # 피팅 실패 시 선형 모델로 폴백
            time_points = np.array([s["start_time"] for s in valid_segments])
            spm_values = np.array([s["spm"] for s in valid_segments])
            return self._fit_linear_model(time_points, spm_values, valid_segments)

    def _fit_linear_model(self, time_points: np.ndarray, spm_values: np.ndarray,
                          valid_segments: List[Dict]) -> Dict:
        """선형 모델 피팅 (폴백 옵션)"""
        try:
            # 선형 회귀
            coeffs = np.polyfit(time_points, spm_values, 1)
            slope, intercept = coeffs

            predicted_spm = np.polyval(coeffs, time_points)
            r_squared = self._calculate_r_squared(spm_values, predicted_spm)
            rmse = np.sqrt(np.mean((spm_values - predicted_spm) ** 2))

            # 선형 기반 피로 지표
            total_decline = (spm_values[0] - spm_values[-1]) / spm_values[0] * 100
            avg_spm = np.mean(spm_values)
            spm_std = np.std(spm_values)

            fatigue_indicators = {
                "total_decline_percentage": round(total_decline, 1),
                "average_spm": round(avg_spm, 1),
                "spm_variability": round(spm_std, 1),
                "slope_per_minute": round(slope * 60, 2),  # 분당 변화율
                "interpretation": self._interpret_linear_change(slope, spm_std)
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
                "predicted_spm": predicted_spm.tolist()
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

    def _calculate_fatigue_indicators(self, spm_values: np.ndarray, time_points: np.ndarray,
                                      spm0: float, di: float, b: float) -> Dict:
        """음성 피로 지표 계산"""
        try:
            # 전체 감소율
            total_decline = (spm_values[0] - spm_values[-1]) / spm_values[0] * 100

            # 평균 SPM
            avg_spm = np.mean(spm_values)

            # 표준편차 (안정성 지표)
            spm_std = np.std(spm_values)

            # 피로 심각도 (0-1 스케일)
            fatigue_severity = min(1.0, abs(total_decline) / 50.0)  # 50% 감소를 최대로 설정

            # 안정화 시점 예측 (SPM이 초기값의 80%에 도달하는 시점)
            target_spm = spm0 * 0.8
            predicted_times = np.linspace(0, time_points[-1] * 2, 1000)
            predicted_values = self.hyperbolic_decline_model(predicted_times, spm0, di, b)
            stabilization_time = None

            for i, val in enumerate(predicted_values):
                if val <= target_spm:
                    stabilization_time = predicted_times[i]
                    break

            return {
                "total_decline_percentage": round(total_decline, 1),
                "average_spm": round(avg_spm, 1),
                "spm_variability": round(spm_std, 1),
                "fatigue_severity": round(fatigue_severity, 3),
                "stabilization_time": round(stabilization_time, 1) if stabilization_time else None,
                "interpretation": self._interpret_fatigue_level(fatigue_severity, total_decline)
            }

        except Exception as e:
            logger.error(f"피로 지표 계산 실패: {e}")
            return {"error": str(e)}

    def _interpret_fatigue_level(self, severity: float, decline: float) -> str:
        """피로 수준 해석"""
        if severity < 0.2:
            return "정상 범위 - 피로 징후가 거의 없음"
        elif severity < 0.4:
            return "경미한 피로 - 약간의 속도 감소 관찰"
        elif severity < 0.6:
            return "중등도 피로 - 뚜렷한 속도 감소 패턴"
        else:
            return "심각한 피로 - 현저한 발화 속도 저하"

    def save_analysis_to_database(self, user_id: str, analysis_result: Dict) -> bool:
        """분석 결과를 데이터베이스에 저장"""
        try:
            db = SessionLocal()

            # 기본 분석 결과 저장
            if "model_parameters" in analysis_result:
                model_params = analysis_result["model_parameters"]
                fatigue_indicators = analysis_result["fatigue_indicators"]

                # SpeedAnalysis 테이블에 저장 (기존 구조 활용)
                db_analysis = models.SpeedAnalysis(
                    user_id=user_id,
                    spm=int(fatigue_indicators.get("average_spm", 0)),
                    speed_category=fatigue_indicators.get("interpretation", "분석됨"),
                    analysis_date=datetime.utcnow().date()
                )

                db.add(db_analysis)
                db.commit()
                db.refresh(db_analysis)

                logger.info(f"분석 결과 저장 완료 (ID: {db_analysis.analysis_id})")
                return True

        except Exception as e:
            logger.error(f"데이터베이스 저장 실패: {e}")
            return False
        finally:
            db.close()

    def visualize_results(self, analysis_result: Dict, save_path: str = None) -> bool:
        """분석 결과 시각화 (한글 폰트 문제 해결)"""
        try:
            if "model_parameters" not in analysis_result:
                logger.warning("시각화할 모델 데이터가 없습니다.")
                return False

            # 한글 폰트 설정 (Windows)
            try:
                import matplotlib.font_manager as fm
                # Windows 기본 한글 폰트 설정
                plt.rcParams['font.family'] = ['Malgun Gothic', 'Arial Unicode MS', 'DejaVu Sans']
                plt.rcParams['axes.unicode_minus'] = False
            except:
                # 폰트 설정 실패시 영어로 표시
                pass

            # 데이터 추출
            time_points = np.array(analysis_result["time_points"])
            observed_spm = np.array(analysis_result["observed_spm"])
            predicted_spm = np.array(analysis_result["predicted_spm"])
            model_type = analysis_result.get("model_type", "unknown")

            # 그래프 생성
            plt.figure(figsize=(12, 8))

            # 관찰된 데이터 플롯
            plt.subplot(2, 1, 1)
            plt.plot(time_points, observed_spm, 'bo-', label='Observed SPM', markersize=6)
            plt.plot(time_points, predicted_spm, 'r-',
                     label=f'{model_type.capitalize()} Model Prediction', linewidth=2)
            plt.xlabel('Time (seconds)')
            plt.ylabel('SPM (syllables/minute)')
            plt.title(f'{model_type.capitalize()} Model - Vocal Fatigue Analysis')
            plt.legend()
            plt.grid(True, alpha=0.3)

            # 모델 정보 표시
            model_params = analysis_result["model_parameters"]
            model_quality = analysis_result["model_quality"]

            if model_type == "hyperbolic":
                info_text = (
                    f"Initial SPM: {model_params['spm0']:.1f}\n"
                    f"Decline Rate: {model_params['initial_decline_rate']:.4f}\n"
                    f"Hyperbolic Exp: {model_params['hyperbolic_exponent']:.3f}\n"
                    f"R² = {model_quality['r_squared']:.3f}\n"
                    f"RMSE = {model_quality['rmse']:.1f}"
                )
            else:  # linear
                info_text = (
                    f"Slope: {model_params['slope']:.4f}\n"
                    f"Change/min: {model_params['change_per_minute']:.2f}\n"
                    f"Intercept: {model_params['intercept']:.1f}\n"
                    f"R² = {model_quality['r_squared']:.3f}\n"
                    f"RMSE = {model_quality['rmse']:.1f}"
                )

            plt.text(0.02, 0.98, info_text, transform=plt.gca().transAxes,
                     verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat'))

            # 잔차 플롯
            plt.subplot(2, 1, 2)
            residuals = observed_spm - predicted_spm
            plt.plot(time_points, residuals, 'go-', label='Residuals (Observed - Predicted)')
            plt.axhline(y=0, color='r', linestyle='--', alpha=0.7)
            plt.xlabel('Time (seconds)')
            plt.ylabel('Residuals (SPM)')
            plt.title('Model Residual Analysis')
            plt.legend()
            plt.grid(True, alpha=0.3)

            plt.tight_layout()

            # 저장
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"Graph saved: {save_path}")
            else:
                plt.show()

            return True

        except Exception as e:
            logger.error(f"Visualization failed: {e}")
            return False

    def analyze_long_speech(self, audio_file_path: str, segment_duration: float = 10.0,
                            user_id: str = None, save_to_db: bool = False) -> Dict:
        """
        전체 분석 파이프라인 실행

        Args:
            audio_file_path: 음성 파일 경로
            segment_duration: 구간 길이 (초)
            user_id: 사용자 ID (DB 저장용)
            save_to_db: 데이터베이스 저장 여부

        Returns:
            전체 분석 결과
        """
        logger.info("=== 하이퍼볼릭 모델 기반 음성 피로 분석 시작 ===")

        # 1. 구간별 분석
        segment_result = self.segment_long_audio(audio_file_path, segment_duration)

        if segment_result["status"] != "success":
            return segment_result

        # 2. 하이퍼볼릭 모델 피팅
        model_result = self.fit_hyperbolic_model(segment_result["segments"])

        if model_result is None:
            return {
                "status": "model_fitting_failed",
                "segments": segment_result["segments"],
                "message": "하이퍼볼릭 모델 피팅에 실패했습니다."
            }

        # 3. 결과 통합
        final_result = {
            "status": "success",
            "analysis_type": "hyperbolic_vocal_fatigue",
            "timestamp": datetime.now().isoformat(),
            "audio_info": {
                "total_duration": segment_result["total_duration"],
                "segment_count": segment_result["segment_count"],
                "valid_segments": len([s for s in segment_result["segments"] if s["is_valid"]])
            },
            "segments": segment_result["segments"],
            **model_result
        }

        # 4. 데이터베이스 저장 (선택사항)
        if save_to_db and user_id:
            self.save_analysis_to_database(user_id, final_result)

        # 5. 결과 저장
        self.analysis_results.append(final_result)

        logger.info("=== 분석 완료 ===")
        logger.info(f"피로 수준: {final_result['fatigue_indicators']['interpretation']}")

        return final_result


def main():
    """메인 실행 함수 - 테스트용"""
    analyzer = HyperbolicVocalFatigueAnalyzer()

    # 테스트용 음성 파일 경로
    test_audio_path = r"C:\Users\ckswn\Downloads\animalmeeting_01_ahn_64kb.wav"  # raw string 사용


    if os.path.exists(test_audio_path):
        try:
            # 분석 실행
            result = analyzer.analyze_long_speech(
                audio_file_path=test_audio_path,
                segment_duration=10.0,
                user_id="test_user",
                save_to_db=False
            )

            # 결과 출력
            print("\n=== 분석 결과 ===")
            print(f"상태: {result['status']}")

            if result["status"] == "success":
                print(f"총 길이: {result['audio_info']['total_duration']:.1f}초")
                print(f"분석 구간: {result['audio_info']['valid_segments']}개")

                model_params = result["model_parameters"]
                print(f"\n모델 파라미터:")
                print(f"  초기 SPM: {model_params['spm0']:.1f}")
                print(f"  감소율: {model_params['initial_decline_rate']:.4f}")
                print(f"  하이퍼볼릭 지수: {model_params['hyperbolic_exponent']:.3f}")

                fatigue = result["fatigue_indicators"]
                print(f"\n피로 분석:")
                print(f"  총 감소율: {fatigue['total_decline_percentage']}%")
                print(f"  평균 SPM: {fatigue['average_spm']}")
                print(f"  해석: {fatigue['interpretation']}")

                # 시각화
                analyzer.visualize_results(result)

        except Exception as e:
            print(f"분석 실패: {e}")
    else:
        print(f"테스트 파일을 찾을 수 없습니다: {test_audio_path}")
        print("실제 음성 파일 경로를 지정하여 테스트하세요.")


if __name__ == "__main__":
    main()