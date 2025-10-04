import sqlite3

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def main():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Add content_domain_id if not exists
    if not column_exists(cursor, 'assessments', 'content_domain_id'):
        cursor.execute("ALTER TABLE assessments ADD COLUMN content_domain_id INTEGER")
        print("Added 'content_domain_id' column to 'assessments' table.")

    # Add bif_file if not exists
    if not column_exists(cursor, 'assessments', 'bif_file'):
        cursor.execute("ALTER TABLE assessments ADD COLUMN bif_file TEXT")
        print("Added 'bif_file' column to 'assessments' table.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    main()