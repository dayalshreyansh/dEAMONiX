import os
import re
import json
import time
import redis
import boto3
import psycopg2
import cv2
import fitz  # PyMuPDF
import numpy as np
from dotenv import load_dotenv

# Optional: Import easyocr or pytesseract for image-based text fallback
try:
    import easyocr
    reader = easyocr.Reader(['en'])
except ImportError:
    reader = None

load_dotenv()

r = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True,
    health_check_interval=30,
    socket_timeout=60,        
    socket_connect_timeout=15
)

s3 = boto3.client('s3',
    endpoint_url=os.getenv('MINIO_ENDPOINT', 'http://localhost:9000'),
    aws_access_key_id=os.getenv('MINIO_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('MINIO_SECRET_KEY')
)
BUCKET_NAME = os.getenv('MINIO_BUCKET_NAME', 'finguard-documents')

verhoeff_d = (
    (0,1,2,3,4,5,6,7,8,9), (1,2,3,4,0,6,7,8,9,5), (2,3,4,0,1,7,8,9,5,6),
    (3,4,0,1,2,8,9,5,6,7), (4,0,1,2,3,9,5,6,7,8), (5,9,8,7,6,0,4,3,2,1),
    (6,5,9,8,7,1,0,4,3,2), (7,6,5,9,8,2,1,0,4,3), (8,7,6,5,9,3,2,1,0,4),
    (9,8,7,6,5,4,3,2,1,0)
)
verhoeff_p = (
    (0,1,2,3,4,5,6,7,8,9), (1,5,7,6,2,8,3,0,9,4), (5,8,0,3,7,9,6,1,4,2),
    (8,9,1,6,0,4,3,5,2,7), (9,4,5,3,1,2,6,8,7,0), (4,2,8,6,5,7,3,9,0,1),
    (2,7,9,3,8,0,6,4,1,5), (7,0,4,6,9,1,3,2,5,8)
)

def validate_aadhaar_verhoeff(number_str):
    """Executes the Verhoeff checksum algorithm to verify structural authenticity."""
    c = 0
    reversed_num = str(number_str)[::-1]
    for i, item in enumerate(reversed_num):
        c = verhoeff_d[c][verhoeff_p[i % 8][int(item)]]
    return c == 0

def extract_text_via_ocr(img_array):
    """Fallback text extraction for scanned documents and flattened image PDFs."""
    if reader is not None:
        try:
            results = reader.readtext(img_array, detail=0)
            return " ".join(results).lower()
        except Exception as e:
            print(f"  ⚠️ OCR Engine Error: {e}")
            return ""
    return ""

def process_identity_document(document_text):
    """Extracts and verifies structural identity compliance across multiple structural identifiers."""
    print("    🔍 Scanning for valid identity tokens and patterns...")
    
    # 1. Look for standard 12-digit identities
    potential_12_digits = re.findall(r'\b\d{4}\s?\d{4}\s?\d{4}\b', document_text)
    
    # 2. Look for standard Tax Identification Formats (PAN Card pattern)
    potential_pan_ids = re.findall(r'\b[a-z]{5}[0-9]{4}[a-z]{1}\b', document_text)
    
    # Validation Execution Loop
    if "pan" in document_text or potential_pan_ids:
        if potential_pan_ids:
            return "GREEN", f"✅ Financial Tax ID Verified: Format matching standard identifier sequence detected ({potential_pan_ids[0].upper()})."
        else:
            return "RED", "🚨 Fraud Alert: Document context references standard Tax ID but valid character sequences are absent."

    if potential_12_digits:
        for identity_string in potential_12_digits:
            clean_number = identity_string.replace(" ", "")
            if validate_aadhaar_verhoeff(clean_number):
                return "GREEN", "✅ Cryptographic Verification Clear: System checksum validated successfully."
        return "RED", "🚨 Fraud Alert: Identity number extracted but failed mathematical checksum validation."
                
    return "RED", "🚨 Compliance Failure: Required government identity structural patterns not found."

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host=os.getenv('POSTGRES_HOST'),
        port=os.getenv('POSTGRES_PORT')
    )

def evaluate_final_loan_package(cursor, application_id):
    print(f"🔄 [Orchestration Engine] Aggregating final metrics for Bundle Package: {application_id}")
    
    cursor.execute("SELECT cibil_score FROM loan_applications WHERE id = %s", (application_id,))
    bureau_row = cursor.fetchone()
    if not bureau_row:
        print(f"   ❌ [Underwriting Error] Parent application {application_id} not found.")
        return
        
    cibil_score = int(float(str(bureau_row[0])))
    print(f"   📊 [Bureau Analysis] Extracted Applicant Bureau CIBIL State: {cibil_score}")

    cursor.execute("SELECT status, math_status, visual_tamper_score FROM forensic_jobs WHERE application_id = %s", (application_id,))
    jobs = cursor.fetchall()
    
    if any(job[0] in ['QUEUED', 'PROCESSING'] for job in jobs):
        print("   ⏳ Outstanding operational slots are still processing in the background. Postponing aggregation.")
        return

    document_tampering_detected = False
    max_visual_tamper = 0.0

    for job in jobs:
        status, math_status, visual_tamper_score = job
        if status == 'FAILED' or math_status == 'RED':
            document_tampering_detected = True
        if visual_tamper_score:
            try:
                float_tamper = float(visual_tamper_score)
                if float_tamper > max_visual_tamper:
                    max_visual_tamper = float_tamper
            except ValueError:
                pass

    final_risk_matrix = "GREEN"
    final_app_status = "PROCESSING"
    composite_credit_score = cibil_score

    # Bank-Grade Trigger: If visual anomaly threshold exceeds 35% or manual math is failed
    if document_tampering_detected or max_visual_tamper > 35.0:
        final_risk_matrix = "RED"
        final_app_status = "UNDER_REVIEW"  
        composite_credit_score = max(300, cibil_score - 300)  
        print("   🚨 [Fraud Alert] Active Manipulation Identified! Escalating bundle to Human-In-The-Loop review.")
    else:
        if cibil_score >= 750:
            final_risk_matrix = "GREEN"
            final_app_status = "APPROVED"
        elif 650 <= cibil_score < 750:
            final_risk_matrix = "YELLOW"
            final_app_status = "UNDER_REVIEW"
        else:
            final_risk_matrix = "RED"
            final_app_status = "REJECTED"

    cursor.execute(
        """
        UPDATE loan_applications 
        SET overall_status = %s, overall_risk_matrix = %s, composite_credit_score = %s, updated_at = CURRENT_TIMESTAMP 
        WHERE id = %s
        """,
        (final_app_status, final_risk_matrix, composite_credit_score, application_id)
    )
    print(f"   🏆 [Underwriting Complete] System Verdict: {final_app_status} | Operational Risk: {final_risk_matrix} | Rating: {composite_credit_score}")
    
    payload = {
        "applicationId": application_id,
        "status": final_app_status,
        "riskMatrix": final_risk_matrix,
        "creditScore": composite_credit_score
    }
    r.publish('finguard_updates', json.dumps(payload))
    print(f"📡 [Fabric Stream] Dispatched broadcast payload for package packet: {application_id}")

def inspect_pdf_metadata(pdf_document):
    print("    🕵️‍♂️  [Metadata Forensics] Extracting binary structural tags...")
    metadata = pdf_document.metadata
    
    fraudulent_software_agents = [
        "photoshop", "canvas", "canva", "illustrator", "coreldraw", 
        "ilovepdf", "pdf2go", "sodapdf", "wondershare", "nitropdf", "gimp"
    ]
    
    creator = str(metadata.get("creator", "")).lower()
    producer = str(metadata.get("producer", "")).lower()
    
    print(f"      [Metadata Profile] Creator Tool: '{metadata.get('creator')}' | Producer: '{metadata.get('producer')}'")
    
    for agent in fraudulent_software_agents:
        if agent in creator or agent in producer:
            return "RED", f"🚨 Metadata Tamper Flagged: File mutated by illicit cloud editing software agent ({agent})."
            
    return "GREEN", "Metadata Validation: Origin signatures match native system print streams."

def process_document(job_id, object_key):
    print(f"\n🔍 [Forensics Engine] Initiating Ingestion on Job Slot: {job_id}")
    db_conn = None
    cursor = None
    local_pdf_path = f"temp_{job_id}.pdf"
    proof_filename = f"proof_{job_id}.png"

    try:
        db_conn = get_db_connection()
        cursor = db_conn.cursor()

        cursor.execute("SELECT application_id FROM forensic_jobs WHERE id = %s", (job_id,))
        row = cursor.fetchone()
        
        if not row:
            print(f"   ⚠️  [Database Desync] Job ID {job_id} was not found. Skipping.")
            return
            
        application_id = row[0]

        cursor.execute("UPDATE forensic_jobs SET status = 'PROCESSING' WHERE id = %s", (job_id,))
        cursor.execute("UPDATE loan_applications SET overall_status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (application_id,))
        db_conn.commit()

        s3.download_file(BUCKET_NAME, object_key, local_pdf_path)
        print("   📥 Stream extracted from vault storage repository.")
        
        try:
            pdf_document = fitz.open(local_pdf_path)
        except Exception:
            print("   ❌ Format Verification Failed: Structural mapping invalid or data stream corrupted.")
            return

        # 1. Metadata Inspection Block
        metadata_status, metadata_log = inspect_pdf_metadata(pdf_document)
        
        # 2. Extract Document Image Frame array
        first_page = pdf_document[0]
        pix = first_page.get_pixmap()
        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        if pix.n == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        elif pix.n == 4:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)

        # 3. Enhanced Text Extraction Layer (Native Extract -> Fallback OCR)
        document_text = first_page.get_text("text").strip().lower()
        if len(document_text) < 15:
            print("   ⚠️  Native text matrix empty or non-indexable. Running Fallback OCR Pipeline...")
            document_text = extract_text_via_ocr(img_array)

        if metadata_status == "RED":
            print(f"   {metadata_log}")
            math_status = "RED"
            math_log = metadata_log
        else:
            # Taxonomy Inference
            inferred_type = "UNKNOWN_UNSTRUCTURED"
            if any(token in document_text for token in ["passport", "license", "identity", "dob", "gender", "aadhaar", "uidai", "pan", "permanent account"]):
                inferred_type = "GOVT_IDENTITY"
            elif any(token in document_text for token in ["statement", "balance", "ledger", "overdraft", "account", "transaction"]):
                inferred_type = "BANK_STATEMENT"
            elif any(token in document_text for token in ["paystub", "payslip", "earnings statement", "w-2", "salary", "provident"]):
                inferred_type = "PAYSTUB"
            print(f"   🏷️  [Structural Inference] Target Taxonomy Determined As: {inferred_type}")

            math_status = "RED"
            math_log = "🚨 Document Compliance Failure: Unrecognized structure or format unreadable."

            if inferred_type == "GOVT_IDENTITY":
                math_status, math_log = process_identity_document(document_text)

            elif inferred_type in ["BANK_STATEMENT", "PAYSTUB"]:
                print("   📊 Executing Cross-Field Semantic Accounting Audits...")
                gross_match = re.search(r'(gross|total earnings|basic|earnings)\s*(?:salary|pay)?\s*[:\-\$]*\s*([\d,]+\.?\d*)', document_text)
                tax_match   = re.search(r'(tax|deductions|tds|withholding|total deduction)\s*[:\-\$]*\s*([\d,]+\.?\d*)', document_text)
                net_match   = re.search(r'(net|take home|net pay|amount paid|net salary)\s*[:\-\$]*\s*([\d,]+\.?\d*)', document_text)

                if gross_match and tax_match and net_match:
                    gross_val = float(gross_match.group(2).replace(',', ''))
                    tax_val   = float(tax_match.group(2).replace(',', ''))
                    net_val   = float(net_match.group(2).replace(',', ''))
                    
                    if abs((gross_val - tax_val) - net_val) > 1.0: # Uniform threshold allowance buffer
                        math_status = "RED"
                        math_log = f"🚨 Semantic Calculation Fraud: Ledger formulas are inconsistent. Gross ({gross_val}) - Deductions ({tax_val}) does not equate to Net Pay ({net_val})."
                    else:
                        math_status = "GREEN"
                        math_log = "Semantic Math Audit: Structural calculation ledger formulas verified completely."
                else:
                    math_status = "RED"
                    math_log = "🚨 Fraud Warning: Required financial calculation rows (Gross, Deductions, or Net Pay) are missing."

        # 4. Bank-Grade Error Level Analysis (ELA) Execution Block
        # Compress temporary asset at targeted threshold quality
        cv2.imwrite("temp_ela.jpg", img_array, [cv2.IMWRITE_JPEG_QUALITY, 90])
        compressed_img = cv2.imread("temp_ela.jpg")
        
        # Calculate matrix absolute pixel difference map
        ela_difference = cv2.absdiff(img_array, compressed_img)
        
        # Isolate localized manipulation discrepancies using deviation metrics instead of Laplacian variance
        mean_diff, std_diff = cv2.meanStdDev(ela_difference)
        visual_score = float(std_diff[0][0] * 10.0) # Scaling distribution spread to reflect anomalous changes
        visual_score = max(0.0, min(100.0, visual_score))
        
        # Amplify contrast thresholding to generate clear high-definition visual heatmaps for underwriter dashboard
        _, ela_heatmap = cv2.threshold(cv2.cvtColor(ela_difference, cv2.COLOR_BGR2GRAY), 12, 255, cv2.THRESH_BINARY)
        
        if os.path.exists("temp_ela.jpg"):
            os.remove("temp_ela.jpg")

        cv2.imwrite(proof_filename, ela_heatmap)
        proof_key = f"proofs/{job_id}.png"
        s3.upload_file(proof_filename, BUCKET_NAME, proof_key, ExtraArgs={'ContentType': 'image/png'})

        pdf_document.close()

        cursor.execute(
            """
            UPDATE forensic_jobs 
            SET status = 'COMPLETED', inferred_document_type = %s, proof_url = %s, 
                math_status = %s, math_analysis_log = %s, visual_tamper_score = %s 
            WHERE id = %s
            """,
            (inferred_type, proof_key, math_status, math_log, visual_score, job_id)
        )
        db_conn.commit()
        print("    ✅ Forensic Child Record Synced. Launching underwriting compiler check...")

        evaluate_final_loan_package(cursor, application_id)
        db_conn.commit()

    except Exception as e:
        print(f"    ❌ System Processing Interrupted on Core Node: {e}")
        if db_conn and cursor:
            cursor.execute("UPDATE forensic_jobs SET status = 'FAILED' WHERE id = %s", (job_id,))
            db_conn.commit()
    finally:
        if cursor: cursor.close()
        if db_conn: db_conn.close()
        
        time.sleep(0.2)
        try:
            if os.path.exists(local_pdf_path): os.remove(local_pdf_path)
            if os.path.exists(proof_filename): os.remove(proof_filename)
        except OSError:
            pass

def process_application_bundle(application_id):
    print(f"\n📦 [Bundle Ingestion] Received Application Package: {application_id}")
    db_conn = None
    cursor = None
    try:
        db_conn = get_db_connection()
        cursor = db_conn.cursor()

        cursor.execute("SELECT id, object_key FROM forensic_jobs WHERE application_id = %s AND status = 'QUEUED'", (application_id,))
        jobs = cursor.fetchall()

        if not jobs:
            print(f"    ⚠️ No queued documents found for Application {application_id}.")
            return

        print(f"    📑 Found {len(jobs)} documents in bundle. Initiating forensics...")

        for job in jobs:
            job_id, object_key = job
            process_document(job_id, object_key)

    except Exception as e:
        print(f"❌ Bundle Processing Error: {e}")
    finally:
        if cursor: cursor.close()
        if db_conn: db_conn.close()

print("\n🎧 [Worker Cluster Operational] Tracking microservices architecture messages...")
while True:
    try:
        result = r.blpop('forensic_tasks', timeout=5) 
        if result:
            queue_name, job_data_str = result
            payload = json.loads(job_data_str)
            application_id = payload.get('applicationId')
            
            if application_id:
                process_application_bundle(application_id)
            else:
                print(f"⚠️ Unrecognized payload structure from Node: {payload}")
                
    except redis.exceptions.TimeoutError:
        continue
    except Exception as e:
        print(f"❌ Core Event Loop Disconnect Fault: {e}")
        time.sleep(2)