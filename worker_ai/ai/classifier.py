"""
classifier.py

Gemini-powered document classifier.

Input:
    OCR extracted text

Output:
{
    "document_type": "...",
    "confidence": 0.98,
    "reason": "..."
}
"""

import json
import re

from ai.gemini_client import GeminiClient


class DocumentClassifier:

    VALID_TYPES = {
        "AADHAAR",
        "PAN",
        "PASSPORT",
        "BANK_STATEMENT",
        "PAYSLIP",
        "SALARY_SLIP",
        "DRIVING_LICENSE",
        "VOTER_ID",
        "UTILITY_BILL",
        "RESUME",
        "MARKSHEET",
        "ADMIT_CARD",
        "OTHER",
        "UNKNOWN"
    }

    def __init__(self):

        self.client = GeminiClient()

    def _normalize_type(self, doc_type: str) -> str:

        if not doc_type:
            return "UNKNOWN"

        value = doc_type.upper().strip()

        aliases = {
            "SALARYSLIP": "SALARY_SLIP",
            "SALARY SLIP": "SALARY_SLIP",
            "PAY SLIP": "PAYSLIP",
            "BANK STATEMENT": "BANK_STATEMENT",
            "DRIVING LICENSE": "DRIVING_LICENSE",
            "DRIVING LICENCE": "DRIVING_LICENSE",
            "VOTER CARD": "VOTER_ID",
            "AADHAR": "AADHAAR",
            "AADHAR CARD": "AADHAAR",
            "AADHAAR CARD": "AADHAAR",
            "PAN CARD": "PAN",
            "UTILITY BILL": "UTILITY_BILL"
        }

        value = aliases.get(value, value)

        if value not in self.VALID_TYPES:
            return "OTHER"

        return value

    def classify(
        self,
        document_text: str
    ) -> dict:

        system_prompt = """
You are an AI document classifier for a bank underwriting system.

Your task is to identify the document type.

Choose EXACTLY ONE of:

AADHAAR
PAN
PASSPORT
BANK_STATEMENT
PAYSLIP
SALARY_SLIP
DRIVING_LICENSE
VOTER_ID
UTILITY_BILL
RESUME
MARKSHEET
ADMIT_CARD
OTHER
UNKNOWN

Definitions:

OTHER
- The document is readable but is NOT one of the supported banking documents.
- Examples:
  Resume
  College admit card
  Examination paper
  Statistics table
  Notes
  Books
  Research paper

UNKNOWN
- The document is unreadable.
- OCR completely failed.
- Not enough information exists.

Return ONLY valid JSON.

Example:

{
    "document_type":"PAN",
    "confidence":0.99,
    "reason":"Government PAN card detected."
}

Do not include markdown.
Do not explain.
"""

        response = self.client.generate(
            prompt=document_text[:12000],
            system_instruction=system_prompt
        )

        try:

            match = re.search(
                r"\{.*\}",
                response,
                re.DOTALL
            )

            if match:
                response = match.group()

            result = json.loads(response)

        except Exception:

            return {
                "document_type": "UNKNOWN",
                "confidence": 0.0,
                "reason": "Unable to parse Gemini response."
            }

        document_type = self._normalize_type(
            result.get("document_type", "UNKNOWN")
        )

        confidence = result.get("confidence", 0.0)

        try:
            confidence = float(confidence)
        except Exception:
            confidence = 0.0

        confidence = max(
            0.0,
            min(confidence, 1.0)
        )

        return {
            "document_type": document_type,
            "confidence": confidence,
            "reason": result.get(
                "reason",
                ""
            )
        }