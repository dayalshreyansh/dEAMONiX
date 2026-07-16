from dataclasses import dataclass, field

import fitz
import numpy as np


@dataclass
class PDFData:

    # -----------------------------
    # Raw PDF
    # -----------------------------

    pdf_document: fitz.Document

    image: np.ndarray

    text: str

    # OCR Result

    ocr_text: str = ""

    # -----------------------------
    # Classification
    # -----------------------------

    document_type: str = "UNKNOWN"

    classification_confidence: float = 0.0

    # -----------------------------
    # Extraction
    # -----------------------------

    extracted_fields: dict = field(default_factory=dict)

    # -----------------------------
    # Validation
    # -----------------------------

    validation_status: str = "UNKNOWN"

    validation_reason: str = ""

    validation_confidence: float = 0.0

    # -----------------------------
    # Cryptographic Validation
    # -----------------------------

    crypto_status: str = "UNKNOWN"

    crypto_reason: str = ""

    # -----------------------------
    # Tamper Detection
    # -----------------------------

    tamper_score: float = 0.0

    heatmap_path: str = ""