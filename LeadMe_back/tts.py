import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

# 한글 폰트 설정 (Windows)
plt.rcParams['font.family'] = ['Malgun Gothic', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False


def hyperbolic_spm(t, spm0, di, b):
    """하이퍼볼릭 SPM 계산"""
    denominator = 1 + b * di * t
    return spm0 / (denominator ** (1 / b))


def plot_hyperbolic_comparison():
    # 파라미터 설정
    SPM0 = 220  # 초기 SPM
    Di = 0.005  # 감소율
    t = np.arange(0, 61, 1)  # 시간 (0~60초)

    # 다양한 b값
    b_values = [0.1, 0.3, 0.5, 0.7, 1.0]
    colors = ['red', 'magenta', 'blue', 'green', 'black']
    line_styles = ['-', '-', '-', '-', '--']
    line_widths = [3, 2, 2, 2, 3]

    # 메인 비교 그래프
    plt.figure(figsize=(12, 8))

    for i, b in enumerate(b_values):
        SPM_t = hyperbolic_spm(t, SPM0, Di, b)
        plt.plot(t, SPM_t, color=colors[i], linestyle=line_styles[i],
                 linewidth=line_widths[i], label=f'b = {b}')

    plt.title(f'하이퍼볼릭 모델: b값에 따른 SPM 감소 패턴\nSPM(t) = {SPM0} / (1 + {Di} × b × t)^(1/b)',
              fontsize=14, fontweight='bold')
    plt.xlabel('시간 (초)', fontsize=12)
    plt.ylabel('SPM (음절/분)', fontsize=12)
    plt.legend(loc='upper right', fontsize=11)
    plt.grid(True, alpha=0.3)
    plt.xlim(0, 60)
    plt.ylim(120, 230)

    # 특정 시점 강조선
    plt.axvline(x=10, color='k', linestyle='--', alpha=0.3)
    plt.axvline(x=30, color='k', linestyle='--', alpha=0.3)
    plt.axvline(x=60, color='k', linestyle='--', alpha=0.3)

    # 텍스트 박스 추가
    textstr = 'b = 0.1: 급격한 초기감소\n→ 초기 긴장, 빠른 적응\n\n' + \
              'b = 0.3: 빠른 적응형\n→ 초반 피로 후 회복\n\n' + \
              'b = 0.5: 보통 패턴\n→ 일반적인 피로\n\n' + \
              'b = 0.7: 점진적 감소\n→ 지속적 피로\n\n' + \
              'b = 1.0: 하모닉 모델\n→ 일정한 감소'

    props = dict(boxstyle='round', facecolor='lightgray', alpha=0.8)
    plt.text(0.02, 0.98, textstr, transform=plt.gca().transAxes, fontsize=9,
             verticalalignment='top', bbox=props)

    plt.tight_layout()
    plt.show()

    # 서브플롯으로 상세 분석
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()

    for i, b in enumerate(b_values):
        SPM_t = hyperbolic_spm(t, SPM0, Di, b)

        axes[i].plot(t, SPM_t, color=colors[i], linewidth=3)
        axes[i].plot(0, SPM_t[0], 'ro', markersize=8)
        axes[i].plot(60, SPM_t[-1], 'bo', markersize=8)

        # 감소율 계산
        reduction = ((SPM_t[0] - SPM_t[-1]) / SPM_t[0]) * 100

        axes[i].set_title(f'b = {b}\n감소율: {reduction:.1f}%', fontsize=12)
        axes[i].set_xlabel('시간 (초)')
        axes[i].set_ylabel('SPM')
        axes[i].grid(True, alpha=0.3)
        axes[i].set_xlim(0, 60)
        axes[i].set_ylim(120, 230)

        # 수치 표시
        axes[i].text(5, SPM_t[0] - 10, f'시작: {SPM_t[0]:.0f}', fontsize=10)
        axes[i].text(35, SPM_t[-1] + 10, f'종료: {SPM_t[-1]:.0f}', fontsize=10)

    # 마지막 서브플롯에 전체 비교
    for i, b in enumerate(b_values):
        SPM_t = hyperbolic_spm(t, SPM0, Di, b)
        axes[5].plot(t, SPM_t, color=colors[i], linewidth=2, label=f'b = {b}')

    axes[5].set_title('전체 비교', fontsize=12)
    axes[5].set_xlabel('시간 (초)')
    axes[5].set_ylabel('SPM')
    axes[5].legend(loc='upper right')
    axes[5].grid(True, alpha=0.3)
    axes[5].set_xlim(0, 60)
    axes[5].set_ylim(120, 230)

    plt.suptitle('하이퍼볼릭 모델 b값별 상세 분석', fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.show()


def print_numerical_analysis():
    """수치 분석 결과 출력"""
    SPM0 = 220
    Di = 0.005
    b_values = [0.1, 0.3, 0.5, 0.7, 1.0]
    time_points = [0, 10, 20, 30, 40, 50, 60]

    print("\n=== b값별 SPM 변화 테이블 ===")
    print("시간(초)", end="")
    for b in b_values:
        print(f"\tb={b}", end="")
    print()

    for t_val in time_points:
        print(f"{t_val}초", end="\t")
        for b in b_values:
            SPM_val = hyperbolic_spm(t_val, SPM0, Di, b)
            print(f"{SPM_val:.0f}", end="\t")
        print()

    print("\n=== 60초 후 총 감소율 ===")
    for b in b_values:
        initial_SPM = hyperbolic_spm(0, SPM0, Di, b)
        final_SPM = hyperbolic_spm(60, SPM0, Di, b)
        reduction = ((initial_SPM - final_SPM) / initial_SPM) * 100
        print(f"b = {b}: {reduction:.1f}% 감소 ({initial_SPM:.0f} → {final_SPM:.0f} SPM)")


def compare_fatigue_patterns():
    """피로 패턴 비교 분석"""
    SPM0 = 220
    Di = 0.005
    b_values = [0.1, 0.5, 1.0]
    t = np.arange(0, 61, 1)

    plt.figure(figsize=(14, 6))

    # 3가지 대표적인 패턴만 비교
    patterns = {
        0.1: "급격한 초기 피로형\n(빠른 적응)",
        0.5: "일반적 피로형\n(보통 패턴)",
        1.0: "지속적 피로형\n(하모닉 감소)"
    }

    colors = ['red', 'blue', 'green']

    for i, b in enumerate(b_values):
        SPM_t = hyperbolic_spm(t, SPM0, Di, b)
        plt.plot(t, SPM_t, color=colors[i], linewidth=4,
                 label=f'b = {b}: {patterns[b]}', alpha=0.8)

        # 중요 지점 표시
        plt.plot(0, SPM_t[0], 'o', color=colors[i], markersize=10)
        plt.plot(30, SPM_t[30], 's', color=colors[i], markersize=8)
        plt.plot(60, SPM_t[60], '^', color=colors[i], markersize=10)

    plt.title('대표적인 음성 피로 패턴 비교\n○ 시작점, □ 30초 지점, △ 60초 지점',
              fontsize=14, fontweight='bold')
    plt.xlabel('시간 (초)', fontsize=12)
    plt.ylabel('SPM (음절/분)', fontsize=12)
    plt.legend(loc='center right', fontsize=11, bbox_to_anchor=(1.3, 0.5))
    plt.grid(True, alpha=0.3)
    plt.xlim(0, 60)
    plt.ylim(140, 230)

    # 배경 영역 표시
    plt.axhspan(140, 170, alpha=0.1, color='red', label='심각한 피로 영역')
    plt.axhspan(170, 200, alpha=0.1, color='orange', label='중등도 피로 영역')
    plt.axhspan(200, 230, alpha=0.1, color='green', label='정상 영역')

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    print("🔍 하이퍼볼릭 모델 b값 분석 시작...")

    # 1. 기본 비교 그래프
    plot_hyperbolic_comparison()

    # 2. 수치 분석
    print_numerical_analysis()

    # 3. 피로 패턴 비교
    compare_fatigue_patterns()

    print("\n✅ 분석 완료!")