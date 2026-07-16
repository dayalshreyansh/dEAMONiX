"""
ocr_service.py

Extracts text from PDFs.

Pipeline
--------
1. Use native PDF text if available.
2. Otherwise run EasyOCR.
3. Store the final text inside pdf.text so that all
   downstream AI services use the same field.
"""

try:
    import easyocr
except ImportError:
    easyocr = None

from config import OCR
from models.pdf_data import PDFData


class OCRService:

    def __init__(self):

        self.reader = None

        if easyocr is not None:

            print("✅ EasyOCR Loaded")

            self.reader = easyocr.Reader(
                OCR.language,
                gpu=False
            )

        else:

            print("⚠ EasyOCR not installed. OCR fallback disabled.")

    def process(
        self,
        pdf: PDFData
    ) -> PDFData:
        """
        Extract text from the PDF.

        Priority:
        1. Native PDF text
        2. OCR fallback
        """

        native_text = pdf.text.strip()

        # ---------------------------------
        # Native text available
        # ---------------------------------

        if len(native_text) > 40:

            print("📄 Using native PDF text")

            pdf.ocr_text = native_text

            # Keep downstream services simple
            pdf.text = pdf.ocr_text

            return pdf

        # ---------------------------------
        # OCR unavailable
        # ---------------------------------

        if self.reader is None:

            print("⚠ EasyOCR unavailable. Using existing text.")

            pdf.ocr_text = native_text

            pdf.text = pdf.ocr_text

            return pdf

        # ---------------------------------
        # OCR fallback
        # ---------------------------------

        print("🔍 Running EasyOCR...")

        try:

            results = self.reader.readtext(
                pdf.image,
                detail=0
            )

            pdf.ocr_text = " ".join(results)

        except Exception as e:

            print(f"❌ OCR Error: {e}")

            pdf.ocr_text = native_text

        # ---------------------------------
        # Always keep downstream services
        # reading from pdf.text
        # ---------------------------------

        pdf.text = pdf.ocr_text

        print(
            f"📝 Extracted {len(pdf.text)} characters"
        )

        return pdf