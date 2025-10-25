import sqlite3

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def upgrade_database_schema():
    """
    Adds the competency_node column to the assessments table if it doesn't exist.
    This is a one-time operation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if the column already exists
        cursor.execute("PRAGMA table_info(assessments)")
        columns = [col['name'] for col in cursor.fetchall()]
        if 'competency_node' not in columns:
            print("Adding 'competency_node' column to 'assessments' table...")
            cursor.execute("ALTER TABLE assessments ADD COLUMN competency_node TEXT")
            conn.commit()
            print("Column added successfully.")
        else:
            print("'competency_node' column already exists.")
    except Exception as e:
        print(f"An error occurred during schema upgrade: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    print("Running database schema upgrade...")
    upgrade_database_schema()
    print("Upgrade process finished.")