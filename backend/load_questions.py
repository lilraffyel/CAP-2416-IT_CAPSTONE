import sqlite3
import json

# Load JSON data
with open('updatedquestions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Connect to DB
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Create tables if not exist 
cursor.executescript("""
CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    correct_answer TEXT,
    score INTEGER,
    assessment_id INTEGER,
    UNIQUE (text, correct_answer, assessment_id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);

CREATE TABLE IF NOT EXISTS choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER,
    choice_text TEXT,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);
""")
conn.commit()

# Cache assessment titles to IDs to avoid redundant SELECTs
assessment_cache = {}

for item in data:
    title = item['assessmentTitle']
    text = item['text']
    choices = item['choices']
    correct = item['correctAnswer']
    score = item.get('score', 1)

    # Insert assessment if not already cached
    if title not in assessment_cache:
        cursor.execute("INSERT OR IGNORE INTO assessments (title) VALUES (?)", (title,))
        conn.commit()
        cursor.execute("SELECT id FROM assessments WHERE title = ?", (title,))
        assessment_id = cursor.fetchone()[0]
        assessment_cache[title] = assessment_id
    else:
        assessment_id = assessment_cache[title]

    # Check if question already exists by text + correct_answer + assessment_id
    cursor.execute("""
        SELECT id FROM questions 
        WHERE text = ? AND correct_answer = ? AND assessment_id = ?
    """, (text, correct, assessment_id))
    row = cursor.fetchone()

    if row:
        question_id = row[0]
        print(f"Skipped duplicate question: {text[:50]}...")
    else:
        # Insert new question
        cursor.execute("""
            INSERT INTO questions (text, correct_answer, score, assessment_id)
            VALUES (?, ?, ?, ?)
        """, (text, correct, score, assessment_id))
        question_id = cursor.lastrowid

        # Insert choices for this new question
        for choice in choices:
            cursor.execute("INSERT INTO choices (question_id, choice_text) VALUES (?, ?)", (question_id, choice))

conn.commit()
conn.close()

print("✅ Data inserted successfully without duplicates!")
