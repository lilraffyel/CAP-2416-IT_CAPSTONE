import sqlite3
import os

DB_PATH = 'database.db'
BIF_FOLDER = os.path.join(os.path.dirname(__file__), 'prerequisite')

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Create the bayesian_networks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bayesian_networks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL
        )
    """)
    print("✅ 'bayesian_networks' table created or already exists.")

    # 2. Read .bif files and populate the new table
    bif_files = [f for f in os.listdir(BIF_FOLDER) if f.endswith('.bif') and not f.endswith('.backup')]
    for filename in bif_files:
        try:
            with open(os.path.join(BIF_FOLDER, filename), 'r') as f:
                content = f.read()
            cursor.execute(
                "INSERT OR IGNORE INTO bayesian_networks (name, content) VALUES (?, ?)",
                (filename, content)
            )
            print(f"  - Migrated '{filename}' to database.")
        except Exception as e:
            print(f"  - ❌ Could not migrate '{filename}': {e}")
    
    conn.commit()

    # 3. Add bif_id column to assessments table
    if not column_exists(cursor, 'assessments', 'bif_id'):
        cursor.execute("ALTER TABLE assessments ADD COLUMN bif_id INTEGER REFERENCES bayesian_networks(id)")
        print("✅ Added 'bif_id' column to 'assessments' table.")

        # 4. Populate the new bif_id foreign key
        cursor.execute("SELECT id, name FROM bayesian_networks")
        bif_map = {name: bif_id for bif_id, name in cursor.fetchall()}

        for name, bif_id in bif_map.items():
            cursor.execute(
                "UPDATE assessments SET bif_id = ? WHERE bif_file = ?",
                (bif_id, name)
            )
        print("✅ Populated 'bif_id' in 'assessments' table.")
        conn.commit()

    conn.close()
    print("\nMigration complete. You may now refactor the application code.")
    print("It is recommended to remove the old 'bif_file' column from 'assessments' table later.")

if __name__ == "__main__":
    migrate()