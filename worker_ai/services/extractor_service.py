"""
extractor_service.py

Uses Gemini to extract structured fields
from the classified document.

Responsibilities
----------------
✓ Call Gemini extractor
✓ Store extracted fields in PDFData
✓ Keep business logic out of main.py
"""

from ai.extractor import DocumentExtractor


class ExtractorService:

    def __init__(self):

        self.extractor = DocumentExtractor()

    def process(self, pdf):

        print("📑 Extracting document fields...")

        # Prefer OCR text if available
        document_text = pdf.ocr_text if pdf.ocr_text else pdf.text

        result = self.extractor.extract(
            pdf.document_type,
            document_text
        )

        # Ensure we always store a dictionary
        if not isinstance(result, dict):
            result = {}

        pdf.extracted_fields = result

        print("   Extracted Fields:")

        if result:
            for key, value in result.items():
                print(f"      {key}: {value}")
        else:
            print("      No fields extracted.")

        return pdf