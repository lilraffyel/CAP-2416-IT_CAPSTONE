import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Create tables

    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    """)

    # Assessments
    cursor.execute("""
    CREATE TABLE assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT UNIQUE NOT NULL
    )
    """)

    # Questions
    cursor.execute("""
    CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    score INTEGER NOT NULL,
    assessment_id INTEGER,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    )
    """)

    # Choices + Correct Answer
    cursor.execute("""
    CREATE TABLE choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER,
    choice_text TEXT,
    FOREIGN KEY (question_id) REFERENCES questions(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS content_domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )
    """)

    cursor.execute("""
CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    domain_id INTEGER NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Pending',
    tutor_id TEXT,  -- ✅ new
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (domain_id) REFERENCES content_domains(id),
    FOREIGN KEY (tutor_id) REFERENCES users(id) -- tutors are also users
)
""")


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS competencies (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content_domain_id INTEGER NOT NULL,
        grade_level INTEGER NOT NULL,
        total_score INTEGER NOT NULL,
        FOREIGN KEY (content_domain_id) REFERENCES content_domains(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,             
    competency_id TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (competency_id) REFERENCES competencies(id)
)
""")

    # Sample users
    cursor.executemany("""
    INSERT OR IGNORE INTO users (id, name, password, role) VALUES (?, ?, ?, ?)
    """, [
        ('student1', 'Student One', 'password123', 'Student'),
        ('tutor1', 'Tutor One', 'password123', 'Tutor'),
        ('admin1', 'Admin One', 'password123', 'Admin')
    ])

    # Content domains
    cursor.executemany("""
    INSERT OR IGNORE INTO content_domains (name) VALUES (?)
    """, [
        ('Counting and Numeracy',),
        ('Comparing',),
        ('Ordering',),
        ('Place Value and Number Representation',),
        ('Estimation',),
        ('Fractions',),
        ('Money and Operations',),
        ('Numbers',)
    ])

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tutor_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,
    domain_id INTEGER,
    help_request_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (tutor_id) REFERENCES users(id),
    FOREIGN KEY (id) REFERENCES content_domains(id)
)
""")


    # Competencies
    cursor.executescript("""
    INSERT OR IGNORE INTO competencies (id, title, content_domain_id, grade_level, total_score) VALUES
    ('Ordering_Numbers', 'Ordering Numbers Test', (SELECT id FROM content_domains WHERE name = 'Numbers'), 1, 10),
    ('Ordering_Numbers_20', 'Order numbers up to 20 from smallest to largest, and vice versa', (SELECT id FROM content_domains WHERE name = 'Ordering'), 1, 10),
    ('Order_Numbers_100', 'Order numbers up to 100 from smallest to largest, and vice versa', (SELECT id FROM content_domains WHERE name = 'Ordering'), 1, 10),
    ('Ordering_Numbers_1000', 'Order numbers up to 1000 from smallest to largest, and vice versa', (SELECT id FROM content_domains WHERE name = 'Ordering'), 2, 10),
    ('Order_Numbers_10000', 'Order numbers up to 10000 from smallest to largest, and vice versa', (SELECT id FROM content_domains WHERE name = 'Ordering'), 3, 10),
    ('Compare_Order_Decimals', 'Compare and Order decimal numbers with decimal parts to hundredths', (SELECT id FROM content_domains WHERE name = 'Ordering'), 4, 10),
    ('Compare_Two_Numbers', 'Compare two numbers up to 20', (SELECT id FROM content_domains WHERE name = 'Comparing'), 1, 10),
    ('Compare_Values_Bills_Coins', 'Compare the values of different denominations of peso coins and bills up to ₱1000', (SELECT id FROM content_domains WHERE name = 'Comparing'), 2, 10),
    ('Compare_Numbers_Ten_Thousand', 'Compare numbers up to 10,000 using the symbols =, >, and < (Grade 3, QTR 1)', (SELECT id FROM content_domains WHERE name = 'Comparing'), 3, 10),
    ('Compare_Numbers_One_Million', 'Compare numbers up to 1,000,000 using =, <, and >', (SELECT id FROM content_domains WHERE name = 'Comparing'), 4, 10),
    ('Compare_Order_Decimal_Numbers', 'Compare and order decimal numbers with decimal parts to hundredths', (SELECT id FROM content_domains WHERE name = 'Comparing'), 4, 10),
    ('Count_Up_100', 'Count up to 100', (SELECT id FROM content_domains WHERE name = 'Counting and Numeracy'), 1, 10),
    ('Read_Write_Numerals_Up_To_Hundred', 'Read and write numerals up to 100', (SELECT id FROM content_domains WHERE name = 'Counting and Numeracy'), 1, 10),
    ('Read_Write_Numerals_1000', 'Read and write numerals up to 1000', (SELECT id FROM content_domains WHERE name = 'Counting and Numeracy'), 2, 10),
    ('Read_Write_Numerals_Up_To_Ten_Thousand', 'Read and write numbers up to 10,000 in numerals and in words', (SELECT id FROM content_domains WHERE name = 'Counting and Numeracy'), 3, 10),
    ('Read_Write_Numerals_Up_To_Million', 'Read and write numbers up to 1,000,000 in numerals and in words', (SELECT id FROM content_domains WHERE name = 'Counting and Numeracy'), 4, 10),
    ('Count_Up_To_1000', 'Count up to 1000', (SELECT id FROM content_domains WHERE name = 'Counting and Numeracy'), 2, 10),
    ('Sum_Up_To_4_Digits', 'Estimate the sum of addends with up to 4 digits', (SELECT id FROM content_domains WHERE name = 'Estimation'), 3, 10),
    ('Difference_Up_To_4_Digits', 'Estimate the difference of numbers with up to 4 digits', (SELECT id FROM content_domains WHERE name = 'Estimation'), 3, 10),
    ('Sum_Difference_Rounding', 'Estimate the sum and difference of two 5- to 6-digit numbers by rounding the addends to the nearest large place value of the numbers', (SELECT id FROM content_domains WHERE name = 'Estimation'), 4, 10),
    ('Multiply_Two_Numbers', 'Estimate the result of multiplying two numbers where the product is less than 1,000,000', (SELECT id FROM content_domains WHERE name = 'Estimation'), 4, 10),
    ('Quotient_Using_Multiples', 'Estimate the quotient when dividing 3- to 4-digit dividends by 1- to 2-digit divisors, by first estimating the dividends and divisors using multiples of 10', (SELECT id FROM content_domains WHERE name = 'Estimation'), 4, 10),
    ('Divide_2_3_Digit_Numbers', 'Estimate the quotient of 2- to 3-digit numbers divided by 1- to 2-digit numbers, using multiples of 10 or 100 as appropriate', (SELECT id FROM content_domains WHERE name = 'Estimation'), 3, 10),
    ('Product_Using_Multiples', 'Estimate the product of 2- to 3-digit numbers by 1- to 2-digit numbers by estimating the factors using multiples of 10', (SELECT id FROM content_domains WHERE name = 'Estimation'), 3, 10),
    ('Round_Numbers_Hundred_Thousand', 'Round numbers to the nearest hundred thousand', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 4, 10),
    ('Round_Numbers_Thousand', 'Round numbers to the nearest ten, hundred, or thousand', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 3, 10),
    ('Determine_Place_Value_6_Digit_Number', 'Determine the place value of a digit in a 6-digit number, its value, and the digit of a number, given its place value', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 4, 10),
    ('Determine_Place_Value_4_Digit_Number', 'Determine the place value of a digit in a 4-digit number, its value, and the digit of a number, given its place value', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 3, 10),
    ('Determine_Place_Value_3_Digit_Number', 'Determine the place value of a digit in a 3-digit number, its value, and the digit of a number, given its place value', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 2, 10),
    ('Determine_Place_Value_2_Digit_Number', 'Determine the place value of a digit in a 2-digit number, its value, and the digit of a number, given its place value', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 1, 10),
    ('Decompose_2_Digit_Numbers', 'Decompose any 2-digit number into tens and ones, its value, and the digit of a number, given its place value', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 1, 10),
    ('Compose_Decompose_Numbers', 'Compose and decompose numbers up to 10 using concrete materials, its value, and the digit of a number, given its place value', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 1, 10),
    ('Add_Subtract_Dissimilar_Fractions', 'Add and subtract dissimilar fractions using models, its value, and the digit of a number, given its place value', (SELECT id FROM content_domains WHERE name = 'Fractions'), 4, 10);
    """)

    # Diagnostic Exams 
    cursor.executescript("""
    INSERT OR IGNORE INTO competencies (id, title, content_domain_id, grade_level, total_score) VALUES
    ('PlaceValueNR', 'Place Value and Number Representation', (SELECT id FROM content_domains WHERE name = 'Place Value and Number Representation'), 4, 10),
    ('Estimation', 'Estimation', (SELECT id FROM content_domains WHERE name = 'Estimation'), 4, 10);
    """)

   

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    assessment_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    )
    """)

    cursor.execute("""
   CREATE TABLE IF NOT EXISTS teacher_comments (
    result_id INTEGER PRIMARY KEY,
    comment TEXT,
    FOREIGN KEY (result_id) REFERENCES student_results(id)
   )
    """)
    
      # Sample assessment
    cursor.execute("INSERT OR IGNORE INTO assessments (title) VALUES (?)", ("Basic Math Assessment",))

    # Get inserted assessment ID
    cursor.execute("SELECT id FROM assessments WHERE title = ?", ("Basic Math Assessment",))
    assessment_id = cursor.fetchone()[0]

    # Sample question
    cursor.execute("""
        INSERT OR IGNORE INTO questions (text, correct_answer, score, assessment_id)
        VALUES (?, ?, ?, ?)
    """, ("What is 2 + 2?", "4", 5, assessment_id))

    # Get inserted question ID
    cursor.execute("SELECT id FROM questions WHERE text = ?", ("What is 2 + 2?",))
    question_id = cursor.fetchone()[0]

    # Sample choices for the question
    cursor.executemany("""
        INSERT OR IGNORE INTO choices (question_id, choice_text) VALUES (?, ?)
    """, [
        (question_id, "3"),
        (question_id, "4"),
        (question_id, "5")
    ])

    # Sample result
    cursor.execute("""
        INSERT OR IGNORE INTO student_results (student_id, assessment_id, score, total, attempt_number)
        VALUES (?, ?, ?, ?, ?)
    """, ("student1", assessment_id, 5, 5, 1))

    # Sample teacher comment
    cursor.execute("""
        INSERT OR IGNORE INTO teacher_comments (result_id, comment)
        VALUES (
            (SELECT id FROM student_results WHERE student_id = ? AND assessment_id = ?), 
            ?
        )
    """, ("student1", assessment_id, "Good job! Keep it up."))

  


    conn.commit()
    conn.close()
    print("Database initialized with tables and sample data.")

if __name__ == "__main__":
    init_db()
