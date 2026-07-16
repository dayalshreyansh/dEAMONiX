"""
extractor.py

Uses Gemini to extract structured fields from documents.

Input:
    OCR text

Output:
    Dictionary containing extracted fields.

No validation is performed here.
"""

import json

from ai.gemini_client import GeminiClient


class DocumentExtractor:

    def __init__(self):
        self.client = GeminiClient()

    def extract(
        self,
        document_text: str,
        document_type: str
    ) -> dict:

        system_prompt = f"""
You are an intelligent document extraction engine.

The document type is:

{document_type}

Extract every important field.

Return ONLY valid JSON.

Examples:

AADHAAR

{{
    "name":"",
    "aadhaar_number":"",
    "dob":"",
    "gender":"",
    "address":""
}}

PAN

{{
    "name":"",
    "pan_number":"",
    "father_name":"",
    "dob":""
}}

BANK_STATEMENT

{{
    "bank_name":"",
    "account_holder":"",
    "account_number":"",
    "ifsc":"",
    "statement_period":"",
    "transactions":[]
}}

PAYSLIP

{{
    "employee_name":"",
    "company":"",
    "gross_salary":"",
    "deductions":"",
    "net_salary":""
}}

If a field is missing, return an empty string.

Return ONLY JSON.
"""

        response = self.client.generate(
            prompt=document_text,
            system_instruction=system_prompt
        )

        try:

            response = (
                response
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

            return json.loads(response)

        except Exception:

            return {}