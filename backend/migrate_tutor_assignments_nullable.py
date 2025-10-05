import sqlite3

DB_PATH = "database.db"  # Adjust path if needed

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Step 1: Rename old table
    cursor.execute("ALTER TABLE tutor_assignments RENAME TO old_tutor_assignments;")

    # Step 2: Create new table with help_request_id nullable
    cursor.execute("""
        CREATE TABLE tutor_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            tutor_id TEXT NOT NULL,
            help_request_id INTEGER,
            domain_id INTEGER,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Step 3: Copy data
    cursor.execute("""
        INSERT INTO tutor_assignments (id, student_id, tutor_id, help_request_id, domain_id, assigned_at)
        SELECT id, student_id, tutor_id, help_request_id, domain_id, assigned_at FROM old_tutor_assignments;
    """)

    # Step 4: Drop old table
    cursor.execute("DROP TABLE old_tutor_assignments;")

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()