import openai
from openai import OpenAIError, RateLimitError, Timeout
import os
import asyncio
import time
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 연령대별 속도 맵 (단어 수 기준)
age_group_speed_map = {
    '5~12세': {
        '천천히': 2,   # 1초에 2단어
        '중간': 3,     # 1초에 3단어
        '빠르게': 4      # 1초에 4단어
    },
    '13~19세': {
        '천천히': 3,   # 1초에 3단어
        '중간': 5,     # 1초에 5단어
        '빠르게': 6      # 1초에 6단어
    },
    '20세 이상': {
        '천천히': 4,   # 1초에 4단어
        '중간': 6,     # 1초에 6단어
        '빠르게': 8      # 1초에 8단어
    }
}

# 연령대에 맞는 프롬프트 생성
def generate_prompt(age_group: str) -> str:
    if age_group == "5~12세":
        return "5~12세 어린이가 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. 단어는 쉽고 재미있게!"
    elif age_group == "13~19세":
        return "13~19세 청소년이 발음 연습하기 좋은 한국어 문장을 만들어줘. 너무 유치하지 않게, 자연스럽고 일상적인 표현으로!"
    elif age_group == "20세 이상":
        return "20세 이상 성인이 발음 연습하기 좋은 한국어 문장을 만들어줘. 자연스럽고 실생활에서 쓸 수 있는 문장으로 부탁해."
    else:
        return "발음 연습용 쉬운 한국어어 문장을 만들어줘."

# GPT 문장 생성 함수
async def get_sentence_for_age_group(age_group: str) -> str:
    prompt = generate_prompt(age_group)

    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,  
            model="gpt-3.5-turbo",  # 모델 선택
            messages=[{"role": "user", "content": prompt}],  # 사용자 메시지
        )

        # 응답이 없으면 오류 처리
        if not response.get('choices'):
            raise ValueError("OpenAI 응답에 선택지가 없습니다.")
        
        # 응답 반환
        return response['choices'][0]['message']['content'].strip()  # 구 버전 구조에 맞게 수정

    except RateLimitError:
        return "API 호출 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."
    except TimeoutError:
        return "요청 시간이 초과되었습니다. 다시 시도해주세요."
    except OpenAIError as e:
        return f"OpenAI API 오류 발생: {str(e)}"
    except ValueError as e:
        return f"응답 오류: {str(e)}"
    except Exception as e:
        return f"알 수 없는 오류가 발생했습니다: {str(e)}"

# 속도 값 계산
def get_speed(age_group: str, speed_label: str) -> float:
    return age_group_speed_map.get(age_group, {}).get(speed_label, 4)

# 노래방 효과 출력
def display_karaoke_text(text: str, speed: float):
    print("\n[노래방 효과 시작]\n")
    for char in text:
        print(char, end='', flush=True)
        time.sleep(1 / speed)
    print("\n[종료]\n")

# 메인 실행
'''async def main():
    age_group = "5~12세"
    speed_label = "천천히"
    print(f"{age_group}, {speed_label}\n")
    
    sentence = await get_sentence_for_age_group(age_group)
    print(f"\n생성된 문장: {sentence}\n")

    speed = get_speed(age_group, speed_label)
    display_karaoke_text(sentence, speed)

if __name__ == "__main__":
    asyncio.run(main())
'''