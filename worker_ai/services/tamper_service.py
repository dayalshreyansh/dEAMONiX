"""
tamper_service.py

Runs Error Level Analysis (ELA)
to detect possible image tampering.

Responsibilities
----------------
✓ Generate ELA image
✓ Calculate tamper score
✓ Save heatmap
"""

import os
import uuid

import cv2

from config import AI


class TamperService:

    def process(self, pdf):

        print("🕵️ Running OpenCV tamper detection...")

        # ------------------------------------------
        # Compress image
        # ------------------------------------------

        temp_file = f"ela_{uuid.uuid4().hex}.jpg"

        cv2.imwrite(
            temp_file,
            pdf.image,
            [cv2.IMWRITE_JPEG_QUALITY, 90]
        )

        compressed = cv2.imread(temp_file)

        if compressed is None:

            raise RuntimeError(
                "Failed to read compressed ELA image."
            )

        # ------------------------------------------
        # Error Level Analysis
        # ------------------------------------------

        difference = cv2.absdiff(
            pdf.image,
            compressed
        )

        _, stddev = cv2.meanStdDev(
            difference
        )

        score = float(stddev[0][0] * 10)

        score = max(
            0.0,
            min(score, 100.0)
        )

        # ------------------------------------------
        # Heatmap
        # ------------------------------------------

        gray = cv2.cvtColor(
            difference,
            cv2.COLOR_BGR2GRAY
        )

        _, heatmap = cv2.threshold(
            gray,
            12,
            255,
            cv2.THRESH_BINARY
        )

        heatmap_path = f"proof_{uuid.uuid4().hex}.png"

        cv2.imwrite(
            heatmap_path,
            heatmap
        )

        # ------------------------------------------
        # Cleanup
        # ------------------------------------------

        if os.path.exists(temp_file):
            os.remove(temp_file)

        pdf.tamper_score = score
        pdf.heatmap_path = heatmap_path

        print(f"   Tamper Score : {score:.2f}")

        if score >= AI.tamper_threshold:
            print("⚠ Possible visual tampering detected.")
        else:
            print("✅ No significant visual tampering detected.")

        return pdf