import sqlite3

def update_assessments_bif():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Add bif_file column if it doesn't exist
    cursor.execute("PRAGMA table_info(assessments)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'bif_file' not in columns:
        cursor.execute("ALTER TABLE assessments ADD COLUMN bif_file TEXT")

    # List of assessment IDs for estimate.bif
    estimate_ids = [19, 20, 21, 22, 23, 24, 25, 52]
    for aid in estimate_ids:
        cursor.execute(
            "UPDATE assessments SET bif_file = ? WHERE id = ?",
            ('estimate.bif', aid)
        )

    # List of assessment IDs for place-value.bif
    place_value_ids = list(range(26, 34)) + [51]
    for aid in place_value_ids:
        cursor.execute(
            "UPDATE assessments SET bif_file = ? WHERE id = ?",
            ('place-value.bif', aid)
        )

    counting_ids = [13, 14, 15, 16, 17, 18]
    for aid in counting_ids:
        cursor.execute(
            "UPDATE assessments SET bif_file = ? WHERE id = ?",
            ('counting.bif', aid)
        )


    conn.commit()
    conn.close()
    print("Assessments updated with bif_file values.")

if __name__ == "__main__":
    update_assessments_bif()