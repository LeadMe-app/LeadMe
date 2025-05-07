import librosa
import librosa.display
import numpy as np
import matplotlib.pyplot as plt
import pyaudio
import wave
import os
import time


def record_audio(filename="recorded_audio.wav", duration=5, sample_rate=44100, channels=1, format=pyaudio.paInt16):
    """
    오디오를 녹음하고 파일로 저장합니다.

    Args:
        filename: 저장할 파일 이름
        duration: 녹음 시간(초)
        sample_rate: 샘플링 레이트
        channels: 채널 수
        format: 오디오 포맷

    Returns:
        저장된 파일 경로
    """
    chunk = 1024

    # PyAudio 객체 생성
    p = pyaudio.PyAudio()

    print(f"녹음을 시작합니다... {duration}초 동안 말씀해주세요.")

    # 스트림 열기
    stream = p.open(format=format,
                    channels=channels,
                    rate=sample_rate,
                    input=True,
                    frames_per_buffer=chunk)

    frames = []

    # 녹음
    for i in range(0, int(sample_rate / chunk * duration)):
        data = stream.read(chunk)
        frames.append(data)

        # 진행 상황 표시
        if i % 10 == 0:
            print(f"녹음 중... {i * chunk / sample_rate:.1f}/{duration}초")

    print("녹음이 완료되었습니다.")

    # 스트림 닫기
    stream.stop_stream()
    stream.close()
    p.terminate()

    # WAV 파일로 저장
    wf = wave.open(filename, 'wb')
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(format))
    wf.setframerate(sample_rate)
    wf.writeframes(b''.join(frames))
    wf.close()

    return filename


def analyze_speech(audio_file):
    """
    음성 파일을 분석하여 발화 속도 및 기타 정보를 추출합니다.

    Args:
        audio_file: 분석할 오디오 파일 경로

    Returns:
        분석 결과 딕셔너리
    """
    # 파일 로드
    y, sr = librosa.load(audio_file, sr=None)  # 원본 샘플링 레이트 유지

    # 기본 정보 추출
    duration = librosa.get_duration(y=y, sr=sr)

    # 음성 활성화 검출
    frames = librosa.effects.split(y, top_db=20)
    voiced_duration = sum(f[1] - f[0] for f in frames) / sr

    # 음절 수 추정 (한국어에 최적화)
    # 한국어의 경우 약 4-5 음절/초로 가정
    syllables_estimate = int(voiced_duration * 4.5)  # 한국어 평균 발화 속도

    # SPM 계산
    spm = int(syllables_estimate / duration * 60)

    # 시각화
    plt.figure(figsize=(10, 6))
    plt.subplot(2, 1, 1)
    librosa.display.waveshow(y, sr=sr)
    plt.title('Waveform')

    plt.subplot(2, 1, 2)
    D = librosa.amplitude_to_db(np.abs(librosa.stft(y)), ref=np.max)
    librosa.display.specshow(D, sr=sr, x_axis='time', y_axis='log')
    plt.colorbar(format='%+2.0f dB')
    plt.title('Spectrogram')

    plt.tight_layout()
    plt.savefig("audio_analysis.png")

    # 결과 반환
    return {
        "duration": duration,
        "voiced_duration": voiced_duration,
        "voiced_percentage": voiced_duration / duration * 100,
        "syllables_estimate": syllables_estimate,
        "spm": spm
    }


def main():
    # 사용자 입력 받기
    while True:
        try:
            duration = float(input("녹음 시간을 초 단위로 입력하세요 (기본값: 5초): ") or 5)
            if duration > 0:
                break
            print("녹음 시간은 0보다 커야 합니다.")
        except ValueError:
            print("숫자를 입력해주세요.")

    # 파일명 설정
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"recorded_{timestamp}.wav"

    # 녹음 진행
    recorded_file = record_audio(filename=filename, duration=duration)
    print(f"파일이 저장되었습니다: {recorded_file}")

    # 분석 진행
    print("\n음성 분석 중...")
    results = analyze_speech(recorded_file)

    # 결과 출력
    print("\n===== 분석 결과 =====")
    print(f"오디오 길이: {results['duration']:.2f}초")
    print(f"음성 구간: {results['voiced_duration']:.2f}초 (전체의 {results['voiced_percentage']:.1f}%)")
    print(f"추정 음절 수: {results['syllables_estimate']}")
    print(f"발화 속도: {results['spm']} SPM (음절/분)")
    print("\n분석 그래프가 'audio_analysis.png' 파일로 저장되었습니다.")

    # 발화 속도 평가
    if results['spm'] < 180:
        print("발화 속도 평가: 느림")
    elif results['spm'] < 300:
        print("발화 속도 평가: 보통")
    else:
        print("발화 속도 평가: 빠름")


if __name__ == "__main__":
    main()