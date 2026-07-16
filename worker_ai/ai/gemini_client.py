"""
gemini_client.py

Central Gemini API client.

Every AI module (classifier, extractor, validator)
uses this file.

No business logic belongs here.
"""

import time

from google import genai

from config import AI


class GeminiClient:

    def __init__(self):

        if not AI.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY not found in .env"
            )

        self.client = genai.Client(
            api_key=AI.gemini_api_key
        )

        self.model = AI.gemini_model

        print(f"🤖 Using Gemini model: {self.model}")

    def generate(
        self,
        prompt: str,
        system_instruction: str = ""
    ) -> str:

        if system_instruction:
            prompt = (
                system_instruction.strip()
                + "\n\n"
                + prompt.strip()
            )

        last_exception = None

        # Retry transient failures
        for attempt in range(3):

            try:

                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )

                if response and response.text:
                    return response.text.strip()

                raise RuntimeError(
                    "Empty response from Gemini."
                )

            except Exception as e:

                last_exception = e

                print(
                    f"⚠ Gemini attempt {attempt + 1}/3 failed:"
                )
                print(e)

                # Wait before retrying
                time.sleep(2 * (attempt + 1))

        raise RuntimeError(
            f"Gemini API Error: {last_exception}"
        )