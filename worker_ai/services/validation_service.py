"""
validation_service.py

Runs document validation.

Pipeline
--------

Gemini Validation
        ↓
Cryptographic Validation
        ↓
Merge Results
"""

from ai.validator import DocumentValidator
from crypto.cryptographic import CryptographicValidator


class ValidationService:

    def __init__(self):

        self.ai_validator = DocumentValidator()

        self.crypto_validator = CryptographicValidator()

    def process(self, pdf):

        print("🧠 Running AI validation...")

        # Prefer OCR text if available
        document_text = pdf.ocr_text if pdf.ocr_text else pdf.text

        ai_result = self.ai_validator.validate(

            pdf.document_type,

            document_text,

            pdf.extracted_fields

        )

        print(f"   AI Status : {ai_result['status']}")
        print(f"   AI Reason : {ai_result['reason']}")

        print("🔐 Running cryptographic validation...")

        crypto_result = self.crypto_validator.validate_identity(

            pdf.document_type,

            pdf.extracted_fields

        )

        print(f"   Crypto Status : {crypto_result['status']}")
        print(f"   Crypto Reason : {crypto_result['reason']}")

        # Store crypto result in PDFData
        pdf.crypto_status = crypto_result["status"]
        pdf.crypto_reason = crypto_result["reason"]

        # ---------------------------------------
        # Final Decision
        # ---------------------------------------

        if crypto_result["status"] == "RED":

            pdf.validation_status = "RED"

            pdf.validation_reason = crypto_result["reason"]

            pdf.validation_confidence = 1.0

        else:

            pdf.validation_status = ai_result["status"]

            pdf.validation_reason = ai_result["reason"]

            pdf.validation_confidence = float(
                ai_result.get(
                    "confidence",
                    0.0
                )
            )

        print(
            f"✅ Final Validation : {pdf.validation_status}"
        )

        return pdf