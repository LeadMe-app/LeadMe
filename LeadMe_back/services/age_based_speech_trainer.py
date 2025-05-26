import openai
from openai.error import OpenAIError, RateLimitError, APIError, APIConnectionError, InvalidRequestError, AuthenticationError, Timeout
import logging
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 로그 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)  # 로그 레벨 설정 (INFO, ERROR 등)

# 콘솔에 로그 출력 설정
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)  # 콘솔에 출력할 최소 로그 레벨 설정
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)


# 연령대에 맞는 프롬프트 생성
def generate_prompt(age_group: str) -> str:
    if age_group == "5~12세":
        return (
            "5~12세 어린이가 문장 발음 연습하기 좋은 짧은 길이의 한국어 문장을 하나 만들어줘. "
            "내용은 쉽고, 재미있게게 상상력을 자극하는 표현으로 해줘. "
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

# GPT 문장 생성 함수
async def get_sentence_for_age_group(age_group: str) -> str:
    prompt = f'"{generate_prompt(age_group)} 를 바탕으로 랜덤 문장 생성할거야' \
         "문장은 반드시 하나만 만들고, 두 줄이 넘지 않도록 15단어 이내의 짧고 간결한 문장으로 해줘. " \
         "기존에 자주 쓰이는 표현은 피하고 새로운 문장을 만들어줘."\
         "되도록이면 따옴표, 문장부호 같은 건 제외해서 문장을 만들어줘."\
         "문장의 어순이 맞도록, 자연스러운 문장이 되도록, 이질감 없는 문장으로 만들어줘"
    logger.info(f"프롬프트 생성: {prompt}")

    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
        )

        # 응답이 없으면 오류 처리
        if not response.get('choices'):
            raise ValueError("OpenAI 응답에 선택지가 없습니다.")
        
        # 응답 반환
        return response['choices'][0]['message']['content'].strip()

    except RateLimitError:
        logger.error("RateLimitError: 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.")
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."

    except AuthenticationError:
        logger.error("AuthenticationError: OpenAI 인증 오류가 발생했습니다. API 키를 확인해주세요.")
        return "OpenAI 인증 오류가 발생했습니다. API 키를 확인해주세요."

    except Timeout:
        logger.error("Timeout: OpenAI 요청이 시간 초과되었습니다.")
        return "OpenAI 요청이 시간 초과되었습니다."

    except InvalidRequestError as e:
        logger.error(f"InvalidRequestError: 잘못된 요청입니다: {str(e)}")
        return f"잘못된 요청입니다: {str(e)}"

    except APIConnectionError:
        logger.error("APIConnectionError: OpenAI 서버에 연결할 수 없습니다.")
        return "OpenAI 서버에 연결할 수 없습니다."

    except APIError:
        logger.error("APIError: OpenAI 서버 오류가 발생했습니다.")
        return "OpenAI 서버 오류가 발생했습니다."

    except OpenAIError as e:
        logger.error(f"OpenAIError: {str(e)}")
        return f"OpenAI 오류 발생: {str(e)}"

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