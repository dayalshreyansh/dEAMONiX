"""
Uses Gemini to validate a document.

Responsibilities
----------------
✓ Check whether the document appears genuine
✓ Detect missing information
✓ Detect suspicious inconsistencies

This DOES NOT replace cryptographic verification.
Verhoeff/PAN checksum/OpenCV still run afterwards.
"""

import json

from ai.gemini_client import GeminiClient


class DocumentValidator:

    def __init__(self):

        self.client = GeminiClient()

    def validate(
        self,
        document_type: str,
        document_text: str,
        extracted_fields: dict
    ) -> dict:

        system_prompt = f"""
You are an AI document validation system.

The detected document type is:

{document_type}

The extracted fields are:

{json.dumps(extracted_fields, indent=2)}

Determine whether the document appears valid.

Look for:

- Missing mandatory fields
- Impossible values
- Suspicious formatting
- OCR mistakes
- Internal inconsistencies

Return ONLY JSON.

Example:

{{
    "status":"GREEN",
    "reason":"Document appears consistent.",
    "confidence":0.96
}}

Possible status values:

GREEN
YELLOW
RED

Do not explain.
"""

        response = self.client.generate(
            prompt=document_text,
            system_instruction=system_prompt
        )

        try:

            return json.loads(response)

        except Exception:

            return {

                "status": "RED",

                "reason": "Gemini returned invalid JSON.",

                "confidence": 0.0

            }   