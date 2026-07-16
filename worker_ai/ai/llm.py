"""
llm.py

Gemini LLM Service

Responsibilities
----------------
1. Document Classification
2. Field Extraction
3. Future Fraud Reasoning
"""

import json

from google import genai

from config import GEMINI


class LLMService:

    def __init__(self):

        self.client = genai.Client(
            api_key=GEMINI.api_key
        )

        self.model = GEMINI.model_name

    # ---------------------------------------------------

    def _generate(self, prompt: str):

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        return response.text

    # ---------------------------------------------------

    def classify_document(self, text: str):

        prompt = f"""
You are an expert banking document classifier.

Classify this document.

Possible values:

AADHAAR
PAN
BANK_STATEMENT
PAYSLIP
PASSPORT
DRIVING_LICENSE
UNKNOWN

Return ONLY JSON.

Example

{{
"document_type":"AADHAAR",
"confidence":0.98
}}

Document:

{text}
"""

        response = self._generate(prompt)

        return json.loads(response)

    # ---------------------------------------------------

    def extract_fields(self, text: str):

        prompt = f"""
You are an expert document parser.

Extract every useful field.

Return ONLY JSON.

Example:

{{
"name":"",
"dob":"",
"aadhaar_number":"",
"pan_number":"",
"account_number":"",
"bank_name":"",
"gross_salary":"",
"net_salary":""
}}

{text}
"""

        response = self._generate(prompt)

        return json.loads(response)


llm = LLMService()