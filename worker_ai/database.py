import psycopg2
from psycopg2.extras import RealDictCursor

from config import DATABASE


class Database:

    @staticmethod
    def get_connection():
        return psycopg2.connect(
            host=DATABASE.host,
            port=DATABASE.port,
            dbname=DATABASE.database,
            user=DATABASE.user,
            password=DATABASE.password,
            cursor_factory=RealDictCursor
        )