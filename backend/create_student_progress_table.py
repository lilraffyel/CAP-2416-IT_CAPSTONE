import sqlite3

def get_db():
    """Establishes a connection to the database."""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def create_student_progress_table():
    """Creates the student_progress table if it doesn't exist."""
    conn = get_db()
    cursor = conn.cursor()
    
    print("Creating 'student_progress' table if it does not exist...")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_progress (
            student_id TEXT NOT NULL,
            domain_id INTEGER NOT NULL,
            competency_node TEXT NOT NULL,
            estimated_mastery TEXT,
            raw_score TEXT,
            percentage TEXT,
            actual_mastery TEXT,
            is_locked INTEGER DEFAULT 0,
            PRIMARY KEY (student_id, domain_id, competency_node)
        )
    """)
    
    conn.commit()
    conn.close()
    print("Table 'student_progress' is ready.")

if __name__ == '__main__':
    create_student_progress_table()