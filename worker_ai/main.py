"""
main.py

Main orchestration worker.

Coordinates every service.
Contains no AI logic.
"""

import time

from database import Database
from storage import Storage
from queue_manager import QueueManager

from services.pdf_service import PDFService
from services.ocr_service import OCRService
from services.classifier_service import ClassifierService
from services.extractor_service import ExtractorService
from services.validation_service import ValidationService
from services.tamper_service import TamperService
from services.risk_service import RiskService


pdf_service = PDFService()
ocr_service = OCRService()
classifier_service = ClassifierService()
extractor_service = ExtractorService()
validation_service = ValidationService()
tamper_service = TamperService()
risk_service = RiskService()

storage = Storage()
queue = QueueManager()

print("🚀 AI Underwriter Worker Started")


# ---------------------------------------------------
# Expected document mapper
# ---------------------------------------------------

def expected_document_type(object_key: str) -> str:

    key = object_key.lower()

    if "aadhaar" in key or "aadhar" in key:
        return "AADHAAR"

    if "pan" in key:
        return "PAN"

    if "passport" in key:
        return "PASSPORT"

    if "salary" in key or "payslip" in key:
        return "PAYSLIP"

    if "bank" in key:
        return "BANK_STATEMENT"

    return "OTHER"


while True:

    connection = None

    try:

        job = queue.consume()

        if job is None:
            continue

        application_id = job["applicationId"]

        print("\n==============================")
        print(f"Processing Application {application_id}")
        print("==============================")

        connection = Database.get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT id, object_key
            FROM forensic_jobs
            WHERE application_id=%s
            AND status='QUEUED'
            """,
            (application_id,)
        )

        jobs = cursor.fetchall()

        for row in jobs:

            job_id = row["id"]
            object_key = row["object_key"]

            print(f"\n📄 Processing Job {job_id}")

            local_pdf = storage.download(object_key)

            pdf = None

            try:

                pdf = pdf_service.load(local_pdf)

                pdf = ocr_service.process(pdf)

                pdf = classifier_service.process(pdf)

                # ----------------------------
                # Compare expected vs detected
                # ----------------------------

                expected = expected_document_type(object_key)
                detected = pdf.document_type

                document_match = expected == detected

                print(f"   Expected : {expected}")
                print(f"   Detected : {detected}")

                if not document_match:

                    print("❌ Wrong document uploaded")

                    pdf.validation_status = "RED"
                    pdf.validation_reason = (
                        f"Expected {expected} but detected {detected}."
                    )

                else:

                    pdf = extractor_service.process(pdf)

                    pdf = validation_service.process(pdf)

                pdf = tamper_service.process(pdf)

                proof_key = storage.upload_proof(
                    pdf.heatmap_path
                )

                cursor.execute(
                    """
                    UPDATE forensic_jobs

                    SET

                        status='COMPLETED',

                        inferred_document_type=%s,

                        detected_document_type=%s,

                        expected_document_type=%s,

                        document_match=%s,

                        proof_url=%s,

                        math_status=%s,

                        math_analysis_log=%s,

                        visual_tamper_score=%s

                    WHERE id=%s
                    """,
                    (
                        detected,
                        detected,
                        expected,
                        document_match,
                        proof_key,
                        pdf.validation_status,
                        pdf.validation_reason,
                        pdf.tamper_score,
                        job_id
                    )
                )

                connection.commit()

            finally:

                if pdf is not None:

                    try:
                        pdf.pdf_document.close()
                    except Exception:
                        pass

                    if pdf.heatmap_path:
                        Storage.delete_local(
                            pdf.heatmap_path
                        )

                Storage.delete_local(local_pdf)

        # ---------------------------------------
        # Aggregate AI Recommendation
        # ---------------------------------------

        result = risk_service.evaluate(
            cursor,
            application_id
        )

        connection.commit()

        # ---------------------------------------
        # Notify Backend
        # ---------------------------------------

        queue.publish_result(

            application_id,

            result["status"],

            result["risk_matrix"],

            result["credit_score"],

            result["recommendation"],

            result["summary"]

        )

        print("\n✅ Application Completed")

    except Exception as e:

        print(f"\n❌ Worker Error: {e}")

        if connection:
            connection.rollback()

        time.sleep(2)

    finally:

        if connection:
            connection.close()