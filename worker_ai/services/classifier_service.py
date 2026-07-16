"""
classifier_service.py

Service wrapper around the Gemini document classifier.

Responsibilities
----------------
✓ Call Gemini classifier
✓ Store result in PDF object
✓ Keep business logic out of main.py
"""

from ai.classifier import DocumentClassifier


class ClassifierService:

    def __init__(self):

        self.classifier = DocumentClassifier()

    def process(self, pdf):

        print("📄 Classifying document...")

        # Prefer OCR text if available
        document_text = pdf.ocr_text if pdf.ocr_text else pdf.text

        result = self.classifier.classify(
            document_text
        )

        pdf.document_type = result.get(
            "document_type",
            "UNKNOWN"
        )

        pdf.classification_confidence = float(
            result.get(
                "confidence",
                0.0
            )
        )

        print(f"   Type : {pdf.document_type}")
        print(f"   Confidence : {pdf.classification_confidence:.2f}")

        return pdf