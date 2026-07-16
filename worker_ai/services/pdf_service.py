"""
pdf_service.py

Loads a PDF and creates the shared PDF object.
"""

import cv2
import fitz
import numpy as np

from models.pdf_data import PDFData


class PDFService:

    @staticmethod
    def load(pdf_path: str) -> PDFData:

        pdf = fitz.open(pdf_path)

        page = pdf[0]

        pix = page.get_pixmap()

        image = np.frombuffer(
            pix.samples,
            dtype=np.uint8
        ).reshape(
            pix.h,
            pix.w,
            pix.n
        )

        if pix.n == 3:

            image = cv2.cvtColor(
                image,
                cv2.COLOR_RGB2BGR
            )

        elif pix.n == 4:

            image = cv2.cvtColor(
                image,
                cv2.COLOR_RGBA2BGR
            )

        text = page.get_text("text").strip()

        return PDFData(
            pdf_document=pdf,
            image=image,
            text=text
        )