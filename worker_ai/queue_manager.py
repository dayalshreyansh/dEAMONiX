"""
queue_manager.py

Handles all Redis communication.

Responsibilities
----------------
✓ Consume new jobs
✓ Publish worker updates
✓ Future retry queue support
"""

import json
import redis

from config import REDIS


class QueueManager:

    def __init__(self):

        self.redis = redis.Redis(
            host=REDIS.host,
            port=REDIS.port,
            decode_responses=True,
            health_check_interval=REDIS.health_check_interval,
            socket_timeout=REDIS.socket_timeout,
            socket_connect_timeout=REDIS.socket_connect_timeout
        )

    # ----------------------------------
    # Consume Jobs
    # ----------------------------------

    def consume(self):

        result = self.redis.blpop(
            "forensic_tasks",
            timeout=5
        )

        if result is None:
            return None

        _, payload = result

        return json.loads(payload)

    # ----------------------------------
    # Publish Final Result
    # ----------------------------------

    def publish_result(
        self,
        application_id,
        status,
        risk_matrix,
        credit_score,
        recommendation,
        summary
    ):

        payload = {

            "applicationId": application_id,

            "status": status,

            "riskMatrix": risk_matrix,

            "creditScore": credit_score,

            "recommendation": recommendation,

            "summary": summary

        }

        self.redis.publish(
            "finguard_updates",
            json.dumps(payload)
        )

        print("📡 Published Result")

    # ----------------------------------
    # Publish Generic Event
    # ----------------------------------

    def publish(
        self,
        channel,
        payload
    ):

        self.redis.publish(
            channel,
            json.dumps(payload)
        )