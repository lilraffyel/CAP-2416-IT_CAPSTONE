import sqlite3

DB_PATH = 'database.db'
BIF_TO_FIX = 'fractions.bif'

# A valid BIF content based on the provided variables from fractions.bif.
# All nodes are treated as independent root nodes with a 50/50 probability for simplicity and guaranteed validity.
VALID_BIF_CONTENT = """
network Fractions_BN {}

variable Fractions {
    type discrete [ 2 ] { 0, 1 };
}

variable Convert_Decimals_Fractions_Denoms_10_to_100 {
    type discrete [ 2 ] { 0, 1 };
}

variable Reduce_Fractions_To_Simplest {
    type discrete [ 2 ] { 0, 1 };
}

variable Add_Subtract_Dissimilar_Proper_Fractions {
    type discrete [ 2 ] { 0, 1 };
}

variable Generate_Equivalent_Fractions_Models {
    type discrete [ 2 ] { 0, 1 };
}

variable Determine_Equivalent_Fractions {
    type discrete [ 2 ] { 0, 1 };
}

variable Represent_Fractions_Equal_Greater_Than_1 {
    type discrete [ 2 ] { 0, 1 };
}

variable Represent_Unit_Fractions_Denom_2_to_8 {
    type discrete [ 2 ] { 0, 1 };
}

variable Order_Unit_Fractions {
    type discrete [ 2 ] { 0, 1 };
}

variable Read_Write_Fractions_Notation {
    type discrete [ 2 ] { 0, 1 };
}

variable Add_Subtract_Dissimilar_Fractions_Models {
    type discrete [ 2 ] { 0, 1 };
}

variable Order_Dissimilar_Fractions {
    type discrete [ 2 ] { 0, 1 };
}

variable Compare_Dissimilar_Fractions_Symbols {
    type discrete [ 2 ] { 0, 1 };
}

variable Represent_Dissimilar_Fractions_Models {
    type discrete [ 2 ] { 0, 1 };
}

variable Add_Subtract_Similar_Fractions_Models {
    type discrete [ 2 ] { 0, 1 };
}

variable Order_Similar_Fractions {
    type discrete [ 2 ] { 0, 1 };
}

variable Read_Write_Similar_Fractions_Notation {
    type discrete [ 2 ] { 0, 1 };
}

variable Represent_Similar_Fractions_Models_Denom_2_to_8 {
    type discrete [ 2 ] { 0, 1 };
}

variable Read_Write_Unit_Fraction_Notation {
    type discrete [ 2 ] { 0, 1 };
}

variable Compare_1_2_And_1_4 {
    type discrete [ 2 ] { 0, 1 };
}

variable Count_1_2_And_1_4 {
    type discrete [ 2 ] { 0, 1 };
}

variable Illustrate_1_2_And_1_4 {
    type discrete [ 2 ] { 0, 1 };
}

variable Represent_Decimals_Models_Relate_To_Fractions {
    type discrete [ 2 ] { 0, 1 };
}

variable Compare_Order_Decimals_To_Hundredths {
    type discrete [ 2 ] { 0, 1 };
}

variable Determine_Place_Value_Digit_Value_And_Digit {
    type discrete [ 2 ] { 0, 1 };
}

variable Plot_Decimals_Tenths_Number_Line {
    type discrete [ 2 ] { 0, 1 };
}

variable Read_Write_Decimals_To_Hundredths {
    type discrete [ 2 ] { 0, 1 };
}

probability ( Illustrate_1_2_And_1_4 ) {
    table 0.1, 0.9; 
}

probability ( Count_1_2_And_1_4 | Illustrate_1_2_And_1_4 ) {
    ( 0 ) 0.75, 0.25;
    ( 1 ) 0.15, 0.85;
}

probability ( Compare_1_2_And_1_4 | Count_1_2_And_1_4 ) {
    ( 0 ) 0.75, 0.25;
    ( 1 ) 0.15, 0.85;
}

probability ( Read_Write_Unit_Fraction_Notation | Compare_1_2_And_1_4 ) {
    ( 0 ) 0.65, 0.35; 
    ( 1 ) 0.25, 0.75;
}

probability ( Order_Unit_Fractions | Read_Write_Unit_Fraction_Notation ) {
    ( 0 ) 0.75, 0.25; 
    ( 1 ) 0.15, 0.85;
}

probability ( Represent_Unit_Fractions_Denom_2_to_8 | Order_Unit_Fractions ) {
    ( 0 ) 0.75, 0.25; 
    ( 1 ) 0.15, 0.85;
}

probability ( Represent_Fractions_Equal_Greater_Than_1 | Represent_Unit_Fractions_Denom_2_to_8 ) {
    ( 0 ) 0.75, 0.25; 
    ( 1 ) 0.15, 0.85;
}

probability ( Determine_Equivalent_Fractions | Represent_Fractions_Equal_Greater_Than_1 ) {
    ( 0 ) 0.7, 0.3;
    ( 1 ) 0.2, 0.8;
}

probability ( Generate_Equivalent_Fractions_Models | Determine_Equivalent_Fractions ) {
    ( 0 ) 0.7, 0.3;
    ( 1 ) 0.2, 0.8;
}

probability ( Represent_Dissimilar_Fractions_Models | Compare_1_2_And_1_4 ) {
    ( 0 ) 0.65, 0.35;  
    ( 1 ) 0.25, 0.75;
}

probability ( Compare_Dissimilar_Fractions_Symbols | Represent_Dissimilar_Fractions_Models ) {
    ( 0 ) 0.75, 0.25;  
    ( 1 ) 0.15, 0.85;  
}

probability ( Order_Dissimilar_Fractions | Compare_Dissimilar_Fractions_Symbols ) {
    ( 0 ) 0.75, 0.25;  
    ( 1 ) 0.15, 0.85;  
}

probability ( Add_Subtract_Dissimilar_Fractions_Models | Order_Dissimilar_Fractions ) {
    ( 0 ) 0.70, 0.30;  
    ( 1 ) 0.25, 0.75;  
}

probability ( Represent_Similar_Fractions_Models_Denom_2_to_8 | Compare_1_2_And_1_4 ) {
    ( 0 ) 0.65, 0.35;  
    ( 1 ) 0.25, 0.75;  
}

probability ( Read_Write_Similar_Fractions_Notation | Represent_Similar_Fractions_Models_Denom_2_to_8 ) {
    ( 0 ) 0.75, 0.25;  
    ( 1 ) 0.15, 0.85;  
}

probability ( Order_Similar_Fractions | Read_Write_Similar_Fractions_Notation ) {
    ( 0 ) 0.75, 0.25;  
    ( 1 ) 0.15, 0.85;  
}

probability ( Add_Subtract_Similar_Fractions_Models | Order_Similar_Fractions ) {
    ( 0 ) 0.70, 0.30;
    ( 1 ) 0.25, 0.75;
}

probability ( Add_Subtract_Dissimilar_Proper_Fractions | Generate_Equivalent_Fractions_Models, Add_Subtract_Dissimilar_Fractions_Models, Add_Subtract_Similar_Fractions_Models ) {
    ( 0, 0, 0 ) 0.90, 0.10;  
    ( 0, 0, 1 ) 0.70, 0.30; 
    ( 0, 1, 0 ) 0.60, 0.40;  
    ( 0, 1, 1 ) 0.45, 0.55; 
    ( 1, 0, 0 ) 0.50, 0.50; 
    ( 1, 0, 1 ) 0.35, 0.65;  
    ( 1, 1, 0 ) 0.30, 0.70; 
    ( 1, 1, 1 ) 0.10, 0.90;  
}

probability ( Reduce_Fractions_To_Simplest | Add_Subtract_Dissimilar_Proper_Fractions ) {
    ( 0 ) 0.7, 0.3;
    ( 1 ) 0.2, 0.8;
}

probability ( Read_Write_Decimals_To_Hundredths ) {
    table 0.15, 0.85; 
}

probability ( Plot_Decimals_Tenths_Number_Line | Read_Write_Decimals_To_Hundredths ) {
    ( 0 ) 0.70, 0.30;
    ( 1 ) 0.20, 0.80;
}

probability ( Determine_Place_Value_Digit_Value_And_Digit | Plot_Decimals_Tenths_Number_Line ) {
    ( 0 ) 0.70, 0.30;
    ( 1 ) 0.20, 0.80;
}

probability ( Compare_Order_Decimals_To_Hundredths | Determine_Place_Value_Digit_Value_And_Digit ) {
    ( 0 ) 0.70, 0.30;
    ( 1 ) 0.15, 0.85;
}

probability ( Represent_Decimals_Models_Relate_To_Fractions | Compare_Order_Decimals_To_Hundredths ) {
    ( 0 ) 0.70, 0.30;
    ( 1 ) 0.20, 0.80;
}

probability ( Convert_Decimals_Fractions_Denoms_10_to_100 | Reduce_Fractions_To_Simplest, Represent_Decimals_Models_Relate_To_Fractions ) {
    ( 0, 0 ) 0.85, 0.15;
    ( 0, 1 ) 0.50, 0.50;
    ( 1, 0 ) 0.55, 0.45;
    ( 1, 1 ) 0.15, 0.85;
}

probability ( Fractions | Convert_Decimals_Fractions_Denoms_10_to_100 ) {
    ( 0 ) 0.75, 0.25;
    ( 1 ) 0.1, 0.90;
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
