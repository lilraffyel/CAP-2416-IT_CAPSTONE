import sqlite3

DB_PATH = 'database.db'
BIF_TO_FIX = 'fractions.bif'

# A valid BIF content based on the provided variables from fractions.bif.
# All nodes are treated as independent root nodes with a 50/50 probability for simplicity and guaranteed validity.
VALID_BIF_CONTENT = """
network "fractions" {
}
variable "Fractions" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Convert_Decimals_And_Fractions_Denoms_10_100" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Reduce_Fractions_To_Simplest" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Read_Write_10000" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Read_Write_1000" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Read_Write_100" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Recognize_Represent_1000" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Recognize_Represent_100" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Count_Repeated_Addition" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Count_By_Steps_1000" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Count_Up_1000" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Count_By_Steps_100" {
    type discrete [ 2 ] { "0", "1" };
}
variable "Count_Up_100" {
    type discrete [ 2 ] { "0", "1" };
}
probability (Fractions) {
    table 0.5, 0.5;
}
probability (Convert_Decimals_And_Fractions_Denoms_10_100) {
    table 0.5, 0.5;
}
probability (Reduce_Fractions_To_Simplest) {
    table 0.5, 0.5;
}
probability (Read_Write_10000) {
    table 0.5, 0.5;
}
probability (Read_Write_1000) {
    table 0.5, 0.5;
}
probability (Read_Write_100) {
    table 0.5, 0.5;
}
probability (Recognize_Represent_1000) {
    table 0.5, 0.5;
}
probability (Recognize_Represent_100) {
    table 0.5, 0.5;
}
probability (Count_Repeated_Addition) {
    table 0.5, 0.5;
}
probability (Count_By_Steps_1000) {
    table 0.5, 0.5;
}
probability (Count_Up_1000) {
    table 0.5, 0.5;
}
probability (Count_By_Steps_100) {
    table 0.5, 0.5;
}
probability (Count_Up_100) {
    table 0.5, 0.5;
}
"""

def fix_bif_content():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print(f"Attempting to fix '{BIF_TO_FIX}' in the database...")
        
        cursor.execute(
            "UPDATE bayesian_networks SET content = ? WHERE name = ?",
            (VALID_BIF_CONTENT, BIF_TO_FIX)
        )
        
        if cursor.rowcount > 0:
            conn.commit()
            print(f"✅ Successfully reset content for '{BIF_TO_FIX}'.")
        else:
            # If the file wasn't in the DB, insert it.
            cursor.execute(
                "INSERT OR IGNORE INTO bayesian_networks (name, content) VALUES (?, ?)",
                (BIF_TO_FIX, VALID_BIF_CONTENT)
            )
            conn.commit()
            print(f"✅ Successfully inserted content for '{BIF_TO_FIX}'.")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    fix_bif_content()
    print("\nPlease restart your backend server to load the corrected network.")
