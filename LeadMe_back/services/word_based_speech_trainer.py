import logging
import openai
import re
from openai import OpenAIError
from openai.error import RateLimitError
import os
import asyncio
import time
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 로그 설정
logger = logging.getLogger("sentence_generation")
logger.setLevel(logging.INFO)  # INFO 이상 레벨만 출력
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# 연령대에 맞는 프롬프트 생성
def generate_prompt(age_group: str) -> str:
    if age_group == "5~12세":
        return (
            "5~12세 어린이가 문장 발음 연습하기 좋은 짧은 길이의 한국어 문장을 하나 만들어줘. "
            "단어는 쉽고, 내용은 재미있고 상상력을 자극하는 표현으로 해줘. "
            "예를 들어 동물, 놀이, 음식 같은 주제가 좋아."
        )
    elif age_group == "13~19세":
        return (
            "13~19세 청소년이 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. "
            "단 하나의 문장만 만들어 주세요."
            "너무 유치하지 않게, 자연스럽고 일상적인 상황에서 쓰는 표현으로 하고, "
            "학교생활, 친구 관계, 취미 같은 청소년 관심사와 어울리게 해줘."
        )
    elif age_group == "20세 이상":
        return (
            "20세 이상 성인이 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. "
            "단 하나의 문장만 만들어 주세요."
            "자연스럽고 실생활에서 자주 쓰는 대화나 표현으로 하고, "
            "직장, 일상 대화, 뉴스, 사회 이슈 등 다양한 주제를 활용해도 좋아."
        )
    else:
        return (
            "단 하나의 문장만 만들어 주세요."
            "발음 연습용으로 자연스럽고 명확한 한국어 문장을 하나 만들어줘. "
            "연령대에 관계없이 누구나 이해할 수 있도록."
        )

'''
def generate_prompt(age_group: str) -> str:
    if age_group == "5~12세":
        return "5~12세 어린이가 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. 단어는 쉽고 재미있게!"
    elif age_group == "13~19세":
        return "13~19세 청소년이 발음 연습하기 좋은 한국어 문장을 만들어줘. 너무 유치하지 않게, 학생들의 수준에 맞춘 표현으로!"
    elif age_group == "20세 이상":
        return "20세 이상 성인이 발음 연습하기 좋은 한국어 문장을 만들어줘. 자연스럽고 실생활에서 쓸 수 있는 문장으로 부탁해."
    else:
        return "발음 연습용 쉬운 한국어어 문장을 만들어줘."
'''

# GPT 문장 생성 함수 (단어 + 연령대 기반)
async def get_sentence_for_word_and_age(word: str, age_group: str) -> str:
    prompt = f'"{word}"라는 단어를 포함해서 {generate_prompt(age_group)}'
    logger.info(f"프롬프트 생성: {prompt}")

    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )

        if not response.get("choices"):
            logger.error("OpenAI 응답에 선택지가 없습니다.")
            raise ValueError("OpenAI 응답에 선택지가 없습니다.")

        content = response["choices"][0]["message"]["content"].strip()
        logger.info(f"GPT 응답 수신 완료: {content}")
        
        # 문장 분리 후, 단어 포함된 문장 반환
        sentences = re.split(r'(?<=[.!?])\s+', content)
        for sentence in sentences:
            if word in sentence:
                logger.info(f"단어 포함 문장 반환: {sentence.strip()}")
                return sentence.strip()

        # fallback: 단어 포함 문장이 없으면 전체 content 반환
        logger.warning("단어 포함 문장을 찾을 수 없어 전체 문장을 반환합니다.")
        return content

    except RateLimitError:
        logger.warning("RateLimitError: 호출이 너무 많습니다.")
        raise RuntimeError("OpenAI API 호출이 너무 많습니다. 잠시 후 다시 시도해주세요.")
    except OpenAIError as e:
        logger.error(f"OpenAIError 발생: {str(e)}")
        raise RuntimeError(f"OpenAI 오류가 발생했습니다: {str(e)}")
    except Exception as e:
        logger.exception("예기치 못한 오류 발생")
        raise RuntimeError(f"알 수 없는 오류가 발생했습니다: {str(e)}")

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