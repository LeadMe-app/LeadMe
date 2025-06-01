import logging
import openai
import re
from openai import OpenAIError
from openai.error import RateLimitError
import os
import asyncio
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 로그 설정
logger = logging.getLogger("sentence_generation")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# 금지어 리스트
FORBIDDEN_PATTERNS = [
    r"\b술\b",
    r"\b맥주\b",
    r"\b소주\b",
    r"\b담배\b",
    r"\b도박\b",
    r"\b폭력\b",
    r"\b성적",
    r"\b욕설\b",
]

# 패턴 컴파일 (대소문자 무시)
compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in FORBIDDEN_PATTERNS]

def contains_forbidden_content(text: str) -> bool:
    for pattern in compiled_patterns:
        if pattern.search(text):
            return True
    return False

# 연령대별 프롬프트 생성
def generate_prompt(age_group: str) -> str:
    if age_group == "5~12세":
        return (
            "5~12세 어린이가 문장 발음 연습하기 좋은 짧은 길이의 한국어 문장을 하나 만들어줘. "
            "현실적인 주제를 포함해서, **한 문장이지만 반드시 10단어 내외로 충분히 길게** 만들어줘. "
            "내용은 쉽고, 재미있게 상상력을 자극하는 표현으로 해줘. "
            "문장은 짧고 간결하게, 한 문장으로만 만들어줘."
        )
    elif age_group == "13~19세":
        return (
            "13~19세 청소년이 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. "
            "너무 유치하지 않게, 자연스럽고 일상적인 상황에서 쓰는 표현으로 해줘. "
            "현실적인 주제를 포함해서, **한 문장이지만 반드시 20단어 내외로 충분히 길게** 만들어줘. "
            "**짧은 문장은 피하고**, 충분한 길이의 문장을 만들어줘."
        )
    elif age_group == "20세 이상":
        return (
            "20세 이상 성인이 발음 연습하기 좋은 한국어 문장을 하나 만들어줘. "
            "자연스럽고 실생활에서 자주 쓰는 대화나 표현으로 하고, "
            "현실적인 주제를 포함해서, **한 문장이지만 반드시 20단어 내외로 충분히 길게** 만들어줘. "
            "**짧은 문장은 피하고**, 충분한 길이의 문장을 만들어줘. "
            "훈련용 앱에서 사용할 수 있도록 부적절한 주제는 절대 포함하지 마."
        )
    else:
        return (
            "발음 연습용으로 자연스럽고 명확한 한국어 문장을 하나 만들어줘. "
            "연령대에 관계없이 누구나 이해할 수 있도록. "
            "문장은 한 문장으로 간결하고 자연스럽게 만들어줘."
        )

# 문장부호 제거
def remove_punctuation(text: str) -> str:
    cleaned = re.sub(r"[^\w\s가-힣]", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

# GPT 호출 함수
async def get_sentence_for_age_group(age_group: str) -> str:
    prompt = (
        f"{generate_prompt(age_group)} "
        "문장은 반드시 하나만 만들어줘. "
        "기존에 자주 쓰이는 표현은 피하고 새로운 문장을 만들어줘. "
        "문장의 어순이 자연스럽고 발화 연습에 적절한 흐름이 되도록 해줘."
    )

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
        logger.info(f"[{age_group}] GPT 응답 수신 완료 (원문): {content}")

        # 첫 문장만 추출
        first_sentence = content.split("\n")[0].strip()
        clean_content = remove_punctuation(first_sentence)
        logger.info(f"[{age_group}] 문장부호 제거 후 문장: {clean_content}")

        # 부적절한 내용 감지
        if contains_forbidden_content(clean_content):
            logger.warning(f"[{age_group}] 부적절한 문장 감지됨: {clean_content}")
            raise ValueError("부적절한 문장이 감지되었습니다.")

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

# ✅ 부적절할 때만 재시도 로직
async def get_sentence_with_retry_if_needed(age_group: str, max_retries: int = 3) -> str:
    try:
        # 1차 시도
        return await get_sentence_for_age_group(age_group)
    except ValueError as e:
        logger.warning(f"[{age_group}] 초기 문장 부적절: {e}")

    # 재시도 시작
    for attempt in range(1, max_retries + 1):
        try:
            sentence = await get_sentence_for_age_group(age_group)
            return sentence
        except ValueError as e:
            logger.warning(f"[{age_group}] {attempt}회 재시도 실패: {e}")
            continue

    # 실패한 경우
    raise RuntimeError(f"[{age_group}] 문장 생성에 계속 실패했습니다.")

'''
# 메인 실행
async def main():
    for age in ["5~12세", "13~19세", "20세 이상"]:
        try:
            sentence = await get_sentence_with_retry(age)
            print(f"[{age}] 생성된 문장:\n{sentence}\n")
        except Exception as e:
            print(f"[{age}] 문장 생성 실패: {e}")

if __name__ == "__main__":
    asyncio.run(main())
'''