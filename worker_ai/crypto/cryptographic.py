"""
cryptographic.py

Deterministic validation algorithms.

These checks DO NOT use AI.

Responsibilities
----------------
✓ Aadhaar Verhoeff checksum
✓ PAN format validation
✓ Salary arithmetic validation
✓ Bank statement arithmetic validation

Future
------
✓ GSTIN checksum
✓ IFSC validation
✓ MICR validation
"""

import re


# ============================================================
# Verhoeff Tables
# ============================================================

VERHOEFF_D = (
    (0,1,2,3,4,5,6,7,8,9),
    (1,2,3,4,0,6,7,8,9,5),
    (2,3,4,0,1,7,8,9,5,6),
    (3,4,0,1,2,8,9,5,6,7),
    (4,0,1,2,3,9,5,6,7,8),
    (5,9,8,7,6,0,4,3,2,1),
    (6,5,9,8,7,1,0,4,3,2),
    (7,6,5,9,8,2,1,0,4,3),
    (8,7,6,5,9,3,2,1,0,4),
    (9,8,7,6,5,4,3,2,1,0)
)

VERHOEFF_P = (
    (0,1,2,3,4,5,6,7,8,9),
    (1,5,7,6,2,8,3,0,9,4),
    (5,8,0,3,7,9,6,1,4,2),
    (8,9,1,6,0,4,3,5,2,7),
    (9,4,5,3,1,2,6,8,7,0),
    (4,2,8,6,5,7,3,9,0,1),
    (2,7,9,3,8,0,6,4,1,5),
    (7,0,4,6,9,1,3,2,5,8)
)


class CryptographicValidator:

    # ============================================================
    # Aadhaar Verification
    # ============================================================

    @staticmethod
    def validate_aadhaar(number: str) -> bool:

        number = number.replace(" ", "")

        if not re.fullmatch(r"\d{12}", number):
            return False

        c = 0

        reversed_number = number[::-1]

        for i, digit in enumerate(reversed_number):

            c = VERHOEFF_D[c][VERHOEFF_P[i % 8][int(digit)]]

        return c == 0

    # ============================================================
    # PAN Validation
    # ============================================================

    @staticmethod
    def validate_pan(pan: str) -> bool:

        if pan is None:
            return False

        pan = pan.strip().upper()

        pattern = r"^[A-Z]{5}[0-9]{4}[A-Z]$"

        return re.fullmatch(pattern, pan) is not None

    # ============================================================
    # Salary Validation
    # ============================================================

    @staticmethod
    def validate_salary(
        gross,
        deductions,
        net
    ):

        try:

            gross = float(gross)
            deductions = float(deductions)
            net = float(net)

        except Exception:

            return False

        return abs((gross - deductions) - net) <= 1.0

    # ============================================================
    # Bank Statement Validation
    # ============================================================

    @staticmethod
    def validate_bank_statement(
        credits,
        debits,
        opening_balance,
        closing_balance
    ):

        try:

            credits = float(credits)
            debits = float(debits)
            opening_balance = float(opening_balance)
            closing_balance = float(closing_balance)

        except Exception:

            return False

        expected = opening_balance + credits - debits

        return abs(expected - closing_balance) <= 1.0

    # ============================================================
    # Generic Identity Validation
    # ============================================================

    def validate_identity(
        self,
        document_type,
        fields
    ):

        result = {

            "status": "GREEN",

            "reason": "Cryptographic validation passed."

        }

        if document_type == "AADHAAR":

            aadhaar = fields.get("aadhaar_number", "")

            if not self.validate_aadhaar(aadhaar):

                result["status"] = "RED"

                result["reason"] = "Aadhaar checksum failed."

        elif document_type == "PAN":

            pan = fields.get("pan_number", "")

            if not self.validate_pan(pan):

                result["status"] = "RED"

                result["reason"] = "PAN format invalid."

        elif document_type == "PAYSLIP":

            ok = self.validate_salary(

                fields.get("gross_salary"),

                fields.get("deductions"),

                fields.get("net_salary")

            )

            if not ok:

                result["status"] = "RED"

                result["reason"] = "Salary arithmetic mismatch."

        elif document_type == "BANK_STATEMENT":

            ok = self.validate_bank_statement(

                fields.get("total_credits"),

                fields.get("total_debits"),

                fields.get("opening_balance"),

                fields.get("closing_balance")

            )

            if not ok:

                result["status"] = "RED"

                result["reason"] = "Balance calculation mismatch."

        return result