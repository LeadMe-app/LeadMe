import openai
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 연령대에 맞는 프롬프트 생성 함수
def generate_prompt(age_group: str) -> str:
    if age_group == "5~12세":
        return "5~12세 어린이가 발음 연습하기 좋은 문장을 하나 만들어줘. 단어는 쉽고 재미있게!"
    elif age_group == "13~19세":
        return "13~19세 청소년이 발음 연습하기 좋은 문장을 만들어줘. 너무 유치하지 않게, 자연스럽고 일상적인 표현으로!"
    elif age_group == "20세 이상":
        return "20세 이상 성인이 발음 연습하기 좋은 문장을 만들어줘. 자연스럽고 실생활에서 쓸 수 있는 문장으로 부탁해."
    else:
        return "발음 연습용 쉬운 문장을 만들어줘."

# 실제 GPT 문장 생성 함수
async def get_sentence_for_age_group(age_group: str) -> str:
    prompt = generate_prompt(age_group)

    response = await asyncio.to_thread(
        openai.ChatCompletion.create,
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()
