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

# 1. Load Infrastructure Coordinates
load_dotenv()
print("DEBUG PASSWORD:", os.getenv('POSTGRES_PASSWORD'))

# 2. Establish Distributed Message Fabric Loop
r = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True,
    health_check_interval=30,  # Docker socket persistent verification
    socket_timeout=60,        
    socket_connect_timeout=15
)

# 3. Synchronize Enterprise Vault Credentials
s3 = boto3.client('s3',
    endpoint_url=os.getenv('MINIO_ENDPOINT', 'http://localhost:9000'),
    aws_access_key_id=os.getenv('MINIO_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('MINIO_SECRET_KEY')
)
BUCKET_NAME = os.getenv('MINIO_BUCKET_NAME', 'finguard-documents')

# ==================== NEW VERHOEFF CRYPTOGRAPHIC MATRICES ====================
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

def validate_aadhaar_verhoeff(aadhaar_number):
    """Executes the Verhoeff checksum algorithm to verify structural authenticity."""
    c = 0
    reversed_num = str(aadhaar_number)[::-1]
    for i, item in enumerate(reversed_num):
        c = verhoeff_d[c][verhoeff_p[i % 8][int(item)]]
    return c == 0

def process_identity_document(document_text):
    """Extracts and verifies structural identity compliance."""
    print("   🔍 Scanning for valid 12-digit structural identity hashes...")
    
    # Regex to find standard 12-digit formats (e.g., "1234 5678 9012" or "123456789012")
    potential_ids = re.findall(r'\b\d{4}\s?\d{4}\s?\d{4}\b', document_text)
    
    if not potential_ids:
        return "RED", "🚨 Compliance Failure: Required 12-digit identity structure not found."
    
    for identity_string in potential_ids:
        clean_number = identity_string.replace(" ", "")
        
        # Pass the extracted digits into the Verhoeff checksum math
        if validate_aadhaar_verhoeff(clean_number):
            return "GREEN", "✅ Cryptographic Verification Clear: Identity checksum verified."
            
    return "RED", "🚨 Fraud Alert: Identity number extracted but failed Verhoeff checksum validation."
# ==============================================================================

# 4. Centralized Relational Query Router
def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host=os.getenv('POSTGRES_HOST'),
        port=os.getenv('POSTGRES_PORT')
    )

def evaluate_final_loan_package(cursor, application_id):
    """Compiles traditional CIBIL scores with forensic risk vectors across child nodes."""
    print(f"🔄 [Orchestration Engine] Aggregating final metrics for Bundle Package: {application_id}")
    
    # Extract Parent Financial Bureau Metrics
    cursor.execute("SELECT cibil_score FROM loan_applications WHERE id = %s", (application_id,))
    bureau_row = cursor.fetchone()
    if not bureau_row:
        print(f"   ❌ [Underwriting Error] Parent application {application_id} not found.")
        return
        
    # TYPE PROTECTION: Safely force the score into a pure Python integer
    cibil_score = int(float(str(bureau_row[0])))
    print(f"   📊 [Bureau Analysis] Extracted Applicant Bureau CIBIL State: {cibil_score}")

    # Inspect all child jobs associated with this parent contract block
    cursor.execute("SELECT status, math_status, visual_tamper_score FROM forensic_jobs WHERE application_id = %s", (application_id,))
    jobs = cursor.fetchall()
    
    # Asynchronous Checkpoint: Ensure all elements in the application bundle have landed safely
    if any(job[0] in ['QUEUED', 'PROCESSING'] for job in jobs):
        print("   ⏳ Outstanding operational slots are still processing in the background. Postponing aggregation.")
        return

    document_tampering_detected = False
    max_visual_tamper = 0.0

    for job in jobs:
        status, math_status, visual_tamper_score = job
        # Catch explicit failures or explicit red flags
        if status == 'FAILED' or math_status == 'RED':
            document_tampering_detected = True
        if visual_tamper_score:
            try:
                float_tamper = float(visual_tamper_score)
                if float_tamper > max_visual_tamper:
                    max_visual_tamper = float_tamper
            except ValueError:
                pass

    # Safe Scope Initialization Defaults
    final_risk_matrix = "GREEN"
    final_app_status = "PROCESSING"
    composite_credit_score = cibil_score

    if document_tampering_detected:
        # Critical Incident Protocol: Fraud detected during image math or accounting audits
        final_risk_matrix = "RED"
        final_app_status = "UNDER_REVIEW"  # Force human verification loop fallback
        composite_credit_score = max(300, cibil_score - 300)  # Penalize profile score
        print("   🚨 [Fraud Alert] Active Manipulation Identified! Escalating bundle to Human-In-The-Loop review.")
    else:
        # File integrity authenticated. Defer downstream directly to credit policy thresholds.
        if cibil_score >= 750:
            final_risk_matrix = "GREEN"
            final_app_status = "APPROVED"
        elif 650 <= cibil_score < 750:
            final_risk_matrix = "YELLOW"
            final_app_status = "UNDER_REVIEW"
        else:
            final_risk_matrix = "RED"
            final_app_status = "REJECTED"

    # Synchronize evaluation arrays straight into the ledger
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
    # Send message across Redis fabric channel
    r.publish('finguard_updates', json.dumps(payload))
    print(f"📡 [Fabric Stream] Dispatched broadcast payload for package packet: {application_id}")

def inspect_pdf_metadata(pdf_document):
    """Scrapes hidden binary metadata tags to identify illegal software manipulation footprints."""
    print("   🕵️‍♂️  [Metadata Forensics] Extracting binary structural tags...")
    metadata = pdf_document.metadata
    
    # List of unauthorized software strings often used to counterfeit financial records
    fraudulent_software_agents = [
        "photoshop", "canvas", "canva", "illustrator", "coreldraw", 
        "ilovepdf", "pdf2go", "sodapdf", "wondershare", "nitropdf"
    ]
    
    # Target binary metadata fields to scrape
    creator = str(metadata.get("creator", "")).lower()
    producer = str(metadata.get("producer", "")).lower()
    
    print(f"      [Metadata Profile] Creator Tool: '{metadata.get('creator')}' | Producer: '{metadata.get('producer')}'")
    
    # Scan fields for unauthorized software match signatures
    for agent in fraudulent_software_agents:
        if agent in creator or agent in producer:
            log_msg = f"🚨 Metadata Tamper Flagged: File mutated by illicit design agent ({agent})."
            return "RED", log_msg
            
    return "GREEN", "Metadata Validation: Origin signatures match native print streams."

def process_document(job_id, object_key):
    print(f"\n🔍 [Forensics Engine] Initiating Ingestion on Job Slot: {job_id}")
    db_conn = None
    cursor = None
    local_pdf_path = f"temp_{job_id}.pdf"
    proof_filename = f"proof_{job_id}.png"

    try:
        db_conn = get_db_connection()
        cursor = db_conn.cursor()

        # 1. Look up the record and check if it actually exists
        cursor.execute("SELECT application_id FROM forensic_jobs WHERE id = %s", (job_id,))
        row = cursor.fetchone()
        
        if not row:
            print(f"   ⚠️  [Database Desync] Job ID {job_id} was not found in this worker's database view. Skipping underwriting.")
            return
            
        application_id = row[0]

        # 2. Progress State Synchronization
        cursor.execute("UPDATE forensic_jobs SET status = 'PROCESSING' WHERE id = %s", (job_id,))
        cursor.execute("UPDATE loan_applications SET overall_status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (application_id,))
        db_conn.commit()

        # 3. Download Asset from Vault Repository
        s3.download_file(BUCKET_NAME, object_key, local_pdf_path)
        print("   📥 Stream extracted from vault storage repository.")
        
        try:
            pdf_document = fitz.open(local_pdf_path)
        except Exception:
            print("   ❌ Format Verification Failed: Structural mapping invalid or data stream corrupted.")
            return

        # ==================== METADATA SCRAM DEFENSE LAYER ====================
        metadata_status, metadata_log = inspect_pdf_metadata(pdf_document)
        if metadata_status == "RED":
            print(f"   {metadata_log}")
            # Intercept immediately! Fail the file check on metadata grounds alone
            math_status = "RED"
            math_log = metadata_log
        # ==========================================================================
        else:
            first_page = pdf_document[0]
            document_text = first_page.get_text("text").lower()
            
            # --- AUTOMATED TAXONOMY ROUTING AND COMPLIANCE ENTRY CHECKS ---
            inferred_type = "UNKNOWN_UNSTRUCTURED"
            if any(token in document_text for token in ["passport", "license", "identity", "dob", "gender", "aadhaar", "pan"]):
                inferred_type = "GOVT_IDENTITY"
            elif any(token in document_text for token in ["statement", "balance", "ledger", "overdraft", "account"]):
                inferred_type = "BANK_STATEMENT"
            elif any(token in document_text for token in ["paystub", "payslip", "earnings statement", "w-2", "salary"]):
                inferred_type = "PAYSTUB"
            print(f"   🏷️  [Structural Inference] Target Taxonomy Determined As: {inferred_type}")

            # CLOSED-GATE SECURITY: Default to RED. Documents must explicitly prove compliance.
            math_status = "RED"
            math_log = "🚨 Document Compliance Failure: Unrecognized structure or format unreadable."

            # --- VERHOEFF INJECTION HERE ---
            if inferred_type == "GOVT_IDENTITY":
                math_status, math_log = process_identity_document(document_text)

            elif inferred_type in ["BANK_STATEMENT", "PAYSTUB"]:
                print("   📊 Executing Cross-Field Semantic Accounting Audits...")
                gross_match = re.search(r'(gross|total earnings|basic)\s*(?:salary|pay)?\s*[:\-\$]*\s*([\d,]+\.?\d*)', document_text)
                tax_match   = re.search(r'(tax|deductions|tds|withholding)\s*[:\-\$]*\s*([\d,]+\.?\d*)', document_text)
                net_match   = re.search(r'(net|take home|net pay|amount paid)\s*[:\-\$]*\s*([\d,]+\.?\d*)', document_text)

                if gross_match and tax_match and net_match:
                    gross_val = float(gross_match.group(2).replace(',', ''))
                    tax_val   = float(tax_match.group(2).replace(',', ''))
                    net_val   = float(net_match.group(2).replace(',', ''))
                    
                    if abs((gross_val - tax_val) - net_val) > 0.01:
                        math_status = "RED"
                        math_log = "🚨 Semantic Calculation Fraud Flagged: Cross-field equations are logically inconsistent."
                    else:
                        math_status = "GREEN"
                        math_log = "Semantic Math Audit: Calculation parameters verified structurally."
                else:
                    math_status = "RED"
                    math_log = "🚨 Fraud Warning: Required financial layout structures are missing or omitted."

        # OpenCV Computer Vision Micro-Forensic Execution Block 
        pix = first_page.get_pixmap()
        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        if pix.n == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        visual_score = float(max(0.0, min(100.0, (150.0 - laplacian_var) / 1.5)))

        cv2.imwrite("temp_ela.jpg", img_array, [cv2.IMWRITE_JPEG_QUALITY, 95])
        compressed_img = cv2.imread("temp_ela.jpg")
        ela_difference = cv2.absdiff(img_array, compressed_img)
        _, ela_heatmap = cv2.threshold(cv2.cvtColor(ela_difference, cv2.COLOR_BGR2GRAY), 20, 255, cv2.THRESH_BINARY)
        
        if os.path.exists("temp_ela.jpg"):
            os.remove("temp_ela.jpg")

        cv2.imwrite(proof_filename, ela_heatmap)
        proof_key = f"proofs/{job_id}.png"
        s3.upload_file(proof_filename, BUCKET_NAME, proof_key, ExtraArgs={'ContentType': 'image/png'})

        # Explicitly close file handlers so Windows releases its lock
        pdf_document.close()

        # Synchronize individual document forensic fields
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
        print("   ✅ Forensic Child Record Synced. Launching underwriting compiler check...")

        evaluate_final_loan_package(cursor, application_id)
        db_conn.commit()

    except Exception as e:
        print(f"   ❌ System Processing Interrupted on Core Node: {e}")
        if db_conn and cursor:
            cursor.execute("UPDATE forensic_jobs SET status = 'FAILED' WHERE id = %s", (job_id,))
            db_conn.commit()
    finally:
        # Safer cleanup loop that handles Windows OS locks gracefully
        if cursor: cursor.close()
        if db_conn: db_conn.close()
        
        time.sleep(0.2) # Gives the OS a tiny window to completely free memory threads
        try:
            if os.path.exists(local_pdf_path): os.remove(local_pdf_path)
            if os.path.exists(proof_filename): os.remove(proof_filename)
        except OSError as e:
            print(f"   🧹 [Windows File Lock Warning]: Temporary cache file will be cleared on next event cycle: {e.strerror}")

# 5. Long-Polling Broker Connection Execution
def process_application_bundle(application_id):
    """Fetches all documents tied to an application and processes them sequentially."""
    print(f"\n📦 [Bundle Ingestion] Received Application Package: {application_id}")
    db_conn = None
    cursor = None
    try:
        db_conn = get_db_connection()
        cursor = db_conn.cursor()

        # Find all queued documents for this specific application
        cursor.execute("SELECT id, object_key FROM forensic_jobs WHERE application_id = %s AND status = 'QUEUED'", (application_id,))
        jobs = cursor.fetchall()

        if not jobs:
            print(f"   ⚠️ No queued documents found in the database for Application {application_id}.")
            return

        print(f"   📑 Found {len(jobs)} documents in bundle. Initiating sequential forensics...")

        # Process each document found in the database
        for job in jobs:
            job_id, object_key = job
            process_document(job_id, object_key)

    except Exception as e:
        print(f"❌ Bundle Processing Error: {e}")
    finally:
        if cursor: cursor.close()
        if db_conn: db_conn.close()

# 5. Long-Polling Broker Connection Execution
print("🎧 [Worker Cluster Operational] Tracking microservices architecture messages...")
while True:
    try:
        # Listening to the exact queue name Node is pushing to
        result = r.blpop('forensic_tasks', timeout=5) 
        if result:
            queue_name, job_data_str = result
            payload = json.loads(job_data_str)
            
            # Node sends: { "applicationId": "...", "userId": "...", "timestamp": ... }
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