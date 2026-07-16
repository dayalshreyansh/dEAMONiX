"""
storage.py

Handles all MinIO/S3 operations.

Responsibilities
----------------
✓ Download PDF
✓ Upload proof image
✓ Delete temporary files
"""

import os
import uuid

import boto3

from config import STORAGE


class Storage:

    def __init__(self):

        self.client = boto3.client(
            "s3",
            endpoint_url=STORAGE.endpoint,
            aws_access_key_id=STORAGE.access_key,
            aws_secret_access_key=STORAGE.secret_key
        )

        self.bucket = STORAGE.bucket_name

    # ----------------------------------
    # Download PDF
    # ----------------------------------

    def download(self, object_key: str) -> str:

        filename = f"temp_{uuid.uuid4().hex}.pdf"

        self.client.download_file(
            self.bucket,
            object_key,
            filename
        )

        print(f"📥 Downloaded {object_key}")

        return filename

    # ----------------------------------
    # Upload Proof Image
    # ----------------------------------

    def upload_proof(self, filepath: str) -> str:

        filename = os.path.basename(filepath)

        object_key = f"proofs/{filename}"

        self.client.upload_file(
            filepath,
            self.bucket,
            object_key,
            ExtraArgs={
                "ContentType": "image/png"
            }
        )

        print(f"☁ Uploaded {object_key}")

        return object_key

    # ----------------------------------
    # Generic Upload
    # ----------------------------------

    def upload(self, filepath: str, object_key: str):

        self.client.upload_file(
            filepath,
            self.bucket,
            object_key
        )

        return object_key

    # ----------------------------------
    # Delete Local File
    # ----------------------------------

    @staticmethod
    def delete_local(filepath: str):

        if os.path.exists(filepath):

            os.remove(filepath)