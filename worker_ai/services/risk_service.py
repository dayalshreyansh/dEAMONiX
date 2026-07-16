"""
risk_service.py

Aggregates all document results and computes
the AI underwriting recommendation.

IMPORTANT

This service NEVER approves or rejects
an application.

Only a human admin can do that.

The worker produces:

- Risk Matrix
- Credit Score
- AI Recommendation
- AI Summary

Customer status always becomes:

PENDING_REVIEW
"""

class RiskService:

    def evaluate(
        self,
        cursor,
        application_id
    ):

        print(
            f"\n📊 Evaluating application {application_id}"
        )

        # ---------------------------------------
        # Fetch application
        # ---------------------------------------

        cursor.execute(
            """
            SELECT

                cibil_score

            FROM loan_applications

            WHERE id=%s
            """,
            (application_id,)
        )

        row = cursor.fetchone()

        if row is None:

            raise Exception(
                "Application not found."
            )

        cibil_score = int(
            float(row["cibil_score"])
        )

        # ---------------------------------------
        # Fetch forensic jobs
        # ---------------------------------------

        cursor.execute(
            """
            SELECT

                inferred_document_type,

                status,

                math_status,

                math_analysis_log,

                visual_tamper_score

            FROM forensic_jobs

            WHERE application_id=%s
            """,
            (application_id,)
        )

        jobs = cursor.fetchall()

        max_tamper = 0.0

        failed_jobs = []

        for job in jobs:

            if job["status"] == "FAILED":

                failed_jobs.append(
                    "Document processing failed."
                )

            if job["math_status"] == "RED":

                failed_jobs.append(
                    job["math_analysis_log"]
                )

            score = float(
                job["visual_tamper_score"] or 0
            )

            max_tamper = max(
                max_tamper,
                score
            )

        # ---------------------------------------
        # Risk Matrix
        # ---------------------------------------

        risk_matrix = "GREEN"

        if max_tamper > 35:

            risk_matrix = "RED"

        elif cibil_score < 650:

            risk_matrix = "YELLOW"

        # ---------------------------------------
        # AI Recommendation
        # ---------------------------------------

        recommendation = "APPROVE"

        summary = []

        summary.append(
            f"CIBIL Score : {cibil_score}"
        )

        summary.append(
            f"Maximum Tamper Score : {max_tamper:.2f}"
        )

        if failed_jobs:

            recommendation = "REJECT"

            summary.append(
                ""
            )

            summary.append(
                "Issues Detected:"
            )

            for issue in failed_jobs:

                summary.append(
                    f"- {issue}"
                )

        elif max_tamper > 35:

            recommendation = "REVIEW"

            summary.append(
                ""
            )

            summary.append(
                "Visual tampering detected."
            )

        elif cibil_score < 650:

            recommendation = "REVIEW"

            summary.append(
                ""
            )

            summary.append(
                "Low CIBIL score."
            )

        else:

            summary.append(
                ""
            )

            summary.append(
                "All automated verification checks passed."
            )

        ai_summary = "\n".join(summary)

        # ---------------------------------------
        # ALWAYS WAIT FOR ADMIN
        # ---------------------------------------

        customer_status = "PENDING_REVIEW"

        composite_credit_score = cibil_score

        # ---------------------------------------
        # Save application
        # ---------------------------------------

        cursor.execute(
            """
            UPDATE loan_applications

            SET

                overall_status=%s,

                overall_risk_matrix=%s,

                composite_credit_score=%s,

                ai_recommendation=%s,

                ai_summary=%s,

                updated_at=CURRENT_TIMESTAMP

            WHERE id=%s
            """,
            (
                customer_status,
                risk_matrix,
                composite_credit_score,
                recommendation,
                ai_summary,
                application_id
            )
        )

        print()

        print(
            f"Customer Status : {customer_status}"
        )

        print(
            f"AI Recommendation : {recommendation}"
        )

        print(
            f"Risk Matrix : {risk_matrix}"
        )

        print(
            f"Credit Score : {composite_credit_score}"
        )

        return {

            "status": customer_status,

            "risk_matrix": risk_matrix,

            "credit_score": composite_credit_score,

            "recommendation": recommendation,

            "summary": ai_summary

        }