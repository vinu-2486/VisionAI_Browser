from pathlib import Path
import sqlite3


DB_PATH = Path(__file__).with_name('visionai_browser.db')
SCHEMA_PATH = Path(__file__).with_name('schema.sql')


def seed_database() -> None:
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.executescript(SCHEMA_PATH.read_text(encoding='utf-8'))
        connection.execute(
            'INSERT INTO sessions (user_language, form_id, status) VALUES (?, ?, ?)',
            ('ta', 'income_certificate', 'draft'),
        )
        connection.commit()
    finally:
        connection.close()


if __name__ == '__main__':
    seed_database()
    print(f'Seeded database at {DB_PATH}')
