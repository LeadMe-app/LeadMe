import openai
import os
import asyncio
import time
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

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
    

async def get_sentence_for_word_and_age(word: str, age_group: str) -> str:
    prompt = f'"{word}"라는 단어를 포함해서 {generate_prompt(age_group)}'
    
    response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

    # 응답이 없다면 오류 처리
    if not response.choices:
        raise ValueError("OpenAI 응답에 선택지가 없습니다.")
        
    return response.choices[0].message.content.strip()

'''# 예시 메인 실행 함수
async def main():
    age_group = "5~12세"     # 연령대 예시
    keyword = "엄마"           # 단어 예시

    sentence = await get_sentence_for_word_and_age(keyword, age_group)
    print(f"\n[연령대: {age_group} / 단어: '{keyword}']\n생성된 문장: {sentence}\n")

# 실제 실행
if __name__ == "__main__":
    asyncio.run(main())

'''