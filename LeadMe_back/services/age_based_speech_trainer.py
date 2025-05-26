import logging
import openai
import re
from openai import OpenAIError
from openai.error import RateLimitError
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 로그 설정
logger = logging.getLogger("sentence_generation")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# 연령대에 맞는 프롬프트 생성
def generate_prompt(age_group: str) -> str:
    if age_group == "5~12세":
        return (
            "5~12세 어린이가 문장 발음 연습하기 좋은 짧은 길이의 한국어 문장을 하나 만들어줘. "
            "내용은 쉽고, 재미있게 상상력을 자극하는 표현으로 해줘. "
        )
    elif age_group == "13~19세":
        return (
            "13~19세 청소년이 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. "
            "너무 유치하지 않게, 자연스럽고 일상적인 상황에서 쓰는 표현으로 하고, "
        )
    elif age_group == "20세 이상":
        return (
            "20세 이상 성인이 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. "
            "자연스럽고 실생활에서 자주 쓰는 대화나 표현으로 하고, "
            "20세 이상의 연령대에 적절한 문체를 사용해서, 현실적인 주제를 포함한 문장으로 만들어줘."
        )
    else:
        return (
            "발음 연습용으로 자연스럽고 명확한 한국어 문장을 하나 만들어줘. "
            "연령대에 관계없이 누구나 이해할 수 있도록."
        )

# 문장부호 제거 함수
def remove_punctuation(text: str) -> str:
    cleaned = re.sub(r"[^\w\s가-힣]", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

# GPT 문장 생성 함수
async def get_sentence_for_age_group(age_group: str) -> str:
    prompt = f'{generate_prompt(age_group)} ' \
             "문장은 반드시 하나만 만들고, 두 줄이 넘지 않도록 15단어 이내의 짧고 간결한 문장으로 해줘. " \
             "기존에 자주 쓰이는 표현은 피하고 새로운 문장을 만들어줘. " \
             "문장의 어순이 맞도록, 자연스러운 문장이 되도록, 이질감 없는 문장으로 만들어줘."
    logger.info(f"프롬프트 생성: {prompt}")

    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
        )

        if not response.get("choices"):
            logger.error("OpenAI 응답에 선택지가 없습니다.")
            raise ValueError("OpenAI 응답에 선택지가 없습니다.")

        content = response["choices"][0]["message"]["content"].strip()
        logger.info(f"GPT 응답 수신 완료 (원문): {content}")

        # 사후 처리: 문장부호 제거
        clean_content = remove_punctuation(content)
        logger.info(f"문장부호 제거 후 문장: {clean_content}")

        return clean_content

    except RateLimitError:
        logger.warning("RateLimitError: 호출이 너무 많습니다.")
        raise RuntimeError("OpenAI API 호출이 너무 많습니다. 잠시 후 다시 시도해주세요.")
    except OpenAIError as e:
        logger.error(f"OpenAIError 발생: {str(e)}")
        raise RuntimeError(f"OpenAI 오류가 발생했습니다: {str(e)}")
    except Exception as e:
        logger.exception("예기치 못한 오류 발생")
        raise RuntimeError(f"알 수 없는 오류가 발생했습니다: {str(e)}")


'''
# 예시 메인 실행 함수
async def main():
    age_group = "5~12세"
    sentence = await get_sentence_for_age_group(age_group)
    print(f"\n[{age_group}] 생성된 문장 (부호 제거됨): {sentence}\n")

if __name__ == "__main__":
    asyncio.run(main())
'''