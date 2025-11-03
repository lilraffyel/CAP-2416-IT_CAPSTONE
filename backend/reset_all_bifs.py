import sqlite3
import textwrap

DB_PATH = 'database.db'

# --- Define valid, complete BIF content for ALL networks based on your files ---
VALID_BIF_TEMPLATES = {
    "comparing.bif": textwrap.dedent("""
        network Comparing_BN {}

        variable Comparing {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Numbers_One_Million {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Numbers_Ten_Thousand {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Two_Numbers {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Values_Bills_Coins {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Order_Decimal_Numbers {
            type discrete [ 2 ] { 0, 1 };
        }
        probability ( Compare_Two_Numbers ) {
            table 0.2, 0.8;
        }
        probability ( Compare_Order_Decimal_Numbers ) {
            table 0.25, 0.75;
        }
        probability ( Compare_Numbers_Ten_Thousand | Compare_Two_Numbers) {
            ( 0 ) 0.8, 0.2;
            ( 1 ) 0.2, 0.8;
        }
        probability ( Compare_Numbers_One_Million | Compare_Numbers_Ten_Thousand) {
            ( 0 ) 0.75, 0.25;
            ( 1 ) 0.35, 0.65;
        }
        probability ( Comparing | Compare_Numbers_One_Million, Compare_Order_Decimal_Numbers ) {
            (0, 0) 0.85, 0.15; 
            (0, 1) 0.55, 0.45; 
            (1, 0) 0.50, 0.50;
            (1, 1) 0.15, 0.85;
        }
    """),

    "estimate.bif": textwrap.dedent("""
        network Estimation_BN {}

        variable Estimation {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Multiply_Two_Numbers {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Divide_2_3_Digit_Numbers {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Product_Using_Multiples {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Quotient_Using_Multiples {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Sum_Difference_Rounding {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Sum_Up_To_4_Digits {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Difference_Up_To_4_Digits {
            type discrete [ 2 ] { 0, 1 };
        }
        probability ( Sum_Up_To_4_Digits ) {
            table 0.2, 0.8;  
        }
        probability ( Difference_Up_To_4_Digits ) {
            table 0.2, 0.8;  
        }
        probability ( Product_Using_Multiples ) {
            table 0.2, 0.8;
        }
        probability ( Sum_Difference_Rounding | Sum_Up_To_4_Digits, Difference_Up_To_4_Digits ) {
            ( 0, 0 ) 0.85, 0.15;   
            ( 0, 1 ) 0.5, 0.5;   
            ( 1, 0 ) 0.5, 0.5;   
            ( 1, 1 ) 0.15, 0.85;   
        }
        probability ( Divide_2_3_Digit_Numbers | Product_Using_Multiples ) {
            ( 0 ) 0.8, 0.2;
            ( 1 ) 0.25, 0.75;
        }
        probability ( Multiply_Two_Numbers | Sum_Difference_Rounding, Product_Using_Multiples ) {
            ( 0, 0 ) 0.85, 0.15;  
            ( 0, 1 ) 0.45, 0.55;   
            ( 1, 0 ) 0.6, 0.4;     
            ( 1, 1 ) 0.15, 0.85;   
        }
        probability ( Quotient_Using_Multiples | Divide_2_3_Digit_Numbers ) {
            ( 0 ) 0.8, 0.2;
            ( 1 ) 0.2, 0.8;
        }
        probability ( Estimation | Multiply_Two_Numbers, Quotient_Using_Multiples ) {
            ( 0, 0 ) 0.8, 0.2;     
            ( 0, 1 ) 0.45, 0.55;   
            ( 1, 0 ) 0.45, 0.55;     
            ( 1, 1 ) 0.15, 0.85;     
        }
    """),

    "money.bif": textwrap.dedent("""
        network Money_BN {}

        variable Money {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Read_Write_10k_Centavos {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Value_Combo_1k {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Denom_1k {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Value_Bills_Coins_100 {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Denom_100 {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Value_Peso_100 {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Recognize_Coins_Bills_100 {
            type discrete [ 2 ] { 0, 1 };
        }
        probability ( Recognize_Coins_Bills_100 ) {
            table 0.15, 0.85; 
        }
        probability ( Value_Peso_100 | Recognize_Coins_Bills_100 ) {
            ( 0 ) 0.8, 0.2;
            ( 1 ) 0.2, 0.8;
        }
        probability ( Compare_Denom_100 | Recognize_Coins_Bills_100 ) {
            ( 0 ) 0.85, 0.15;
            ( 1 ) 0.25, 0.75;
        }
        probability ( Compare_Denom_1k | Compare_Denom_100 ) {
            ( 0 ) 0.8, 0.2;
            ( 1 ) 0.15, 0.85;
        }
        probability ( Value_Combo_1k | Value_Peso_100 ) {
            ( 0 ) 0.9, 0.1;
            ( 1 ) 0.2, 0.8;
        }
        probability ( Read_Write_10k_Centavos | Compare_Denom_1k, Value_Combo_1k ) {
            ( 0, 0 ) 0.85, 0.15;
            ( 0, 1 ) 0.45, 0.55;
            ( 1, 0 ) 0.45, 0.55;
            ( 1, 1 ) 0.2, 0.8;
        }
        probability ( Money | Read_Write_10k_Centavos ) {
            ( 0 ) 0.85, 0.15;
            ( 1 ) 0.1, 0.9;
        }
    """),

 

    "ordering.bif": textwrap.dedent("""
        network Ordering_BN {}
        }
        variable Ordering_Numbers {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Compare_Order_Decimals {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Order_Numbers_10k {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Order_Numbers_1k {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Order_Numbers_100 {
            type discrete [ 2 ] { 0, 1 };
        }
        variable Order_Numbers_20 {
            type discrete [ 2 ] { 0, 1 };
        }
        probability ( Order_Numbers_20 ) {
            table 0.2, 0.8;
        }
        probability ( Order_Numbers_100 | Order_Numbers_20 ) {
            ( 0 ) 0.85, 0.15;
            ( 1 ) 0.25, 0.75;
        }
        probability ( Order_Numbers_1k | Order_Numbers_100 ) {
            ( 0 ) 0.9, 0.1;  
            ( 1 ) 0.25, 0.75; 
        }
        probability ( Order_Numbers_10k | Order_Numbers_1k ) {
            ( 0 ) 0.8, 0.2;  
            ( 1 ) 0.15, 0.85;  
        }
        probability ( Ordering_Numbers | Order_Numbers_10k ) {
            ( 0 ) 0.7, 0.3;  
            ( 1 ) 0.2, 0.8;
        }
    """),
    
    "fractions.bif": textwrap.dedent("""
        network Fractions_BN {}

        variable Fractions { type discrete [ 2 ] { 0, 1 }; }
        variable Convert_Decimals_Fractions_Denoms_10_to_100 { type discrete [ 2 ] { 0, 1 }; }
        variable Reduce_Fractions_To_Simplest { type discrete [ 2 ] { 0, 1 }; }
        variable Add_Subtract_Dissimilar_Proper_Fractions { type discrete [ 2 ] { 0, 1 }; }
        variable Generate_Equivalent_Fractions_Models { type discrete [ 2 ] { 0, 1 }; }
        variable Determine_Equivalent_Fractions { type discrete [ 2 ] { 0, 1 }; }
        variable Represent_Fractions_Equal_Greater_Than_1 { type discrete [ 2 ] { 0, 1 }; }
        variable Represent_Unit_Fractions_Denom_2_to_8 { type discrete [ 2 ] { 0, 1 }; }
        variable Order_Unit_Fractions { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_Fractions_Notation { type discrete [ 2 ] { 0, 1 }; }
        variable Add_Subtract_Dissimilar_Fractions_Models { type discrete [ 2 ] { 0, 1 }; }
        variable Order_Dissimilar_Fractions { type discrete [ 2 ] { 0, 1 }; }
        variable Compare_Dissimilar_Fractions_Symbols { type discrete [ 2 ] { 0, 1 }; }
        variable Represent_Dissimilar_Fractions_Models { type discrete [ 2 ] { 0, 1 }; }
        variable Add_Subtract_Similar_Fractions_Models { type discrete [ 2 ] { 0, 1 }; }
        variable Order_Similar_Fractions { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_Similar_Fractions_Notation { type discrete [ 2 ] { 0, 1 }; }
        variable Represent_Similar_Fractions_Models_Denom_2_to_8 { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_Unit_Fraction_Notation { type discrete [ 2 ] { 0, 1 }; }
        variable Compare_1_2_And_1_4 { type discrete [ 2 ] { 0, 1 }; }
        variable Count_1_2_And_1_4 { type discrete [ 2 ] { 0, 1 }; }
        variable Illustrate_1_2_And_1_4 { type discrete [ 2 ] { 0, 1 }; }
        variable Represent_Decimals_Models_Relate_To_Fractions { type discrete [ 2 ] { 0, 1 }; }
        variable Compare_Order_Decimals_To_Hundredths { type discrete [ 2 ] { 0, 1 }; }
        variable Determine_Place_Value_Digit_Value_And_Digit { type discrete [ 2 ] { 0, 1 }; }
        variable Plot_Decimals_Tenths_Number_Line { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_Decimals_To_Hundredths { type discrete [ 2 ] { 0, 1 }; }

        probability ( Illustrate_1_2_And_1_4 ) { table 0.1, 0.9; }
        probability ( Count_1_2_And_1_4 | Illustrate_1_2_And_1_4 ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Compare_1_2_And_1_4 | Count_1_2_And_1_4 ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Read_Write_Unit_Fraction_Notation | Compare_1_2_And_1_4 ) { ( 0 ) 0.65, 0.35; ( 1 ) 0.25, 0.75; }
        probability ( Order_Unit_Fractions | Read_Write_Unit_Fraction_Notation ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Represent_Unit_Fractions_Denom_2_to_8 | Order_Unit_Fractions ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Represent_Fractions_Equal_Greater_Than_1 | Represent_Unit_Fractions_Denom_2_to_8 ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Determine_Equivalent_Fractions | Represent_Fractions_Equal_Greater_Than_1 ) { ( 0 ) 0.7, 0.3; ( 1 ) 0.2, 0.8; }
        probability ( Generate_Equivalent_Fractions_Models | Determine_Equivalent_Fractions ) { ( 0 ) 0.7, 0.3; ( 1 ) 0.2, 0.8; }
        probability ( Represent_Dissimilar_Fractions_Models | Compare_1_2_And_1_4 ) { ( 0 ) 0.65, 0.35; ( 1 ) 0.25, 0.75; }
        probability ( Compare_Dissimilar_Fractions_Symbols | Represent_Dissimilar_Fractions_Models ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Order_Dissimilar_Fractions | Compare_Dissimilar_Fractions_Symbols ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Add_Subtract_Dissimilar_Fractions_Models | Order_Dissimilar_Fractions ) { ( 0 ) 0.70, 0.30; ( 1 ) 0.25, 0.75; }
        probability ( Represent_Similar_Fractions_Models_Denom_2_to_8 | Compare_1_2_And_1_4 ) { ( 0 ) 0.65, 0.35; ( 1 ) 0.25, 0.75; }
        probability ( Read_Write_Similar_Fractions_Notation | Represent_Similar_Fractions_Models_Denom_2_to_8 ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Order_Similar_Fractions | Read_Write_Similar_Fractions_Notation ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.15, 0.85; }
        probability ( Add_Subtract_Similar_Fractions_Models | Order_Similar_Fractions ) { ( 0 ) 0.70, 0.30; ( 1 ) 0.25, 0.75; }
        probability ( Add_Subtract_Dissimilar_Proper_Fractions | Generate_Equivalent_Fractions_Models, Add_Subtract_Dissimilar_Fractions_Models, Add_Subtract_Similar_Fractions_Models ) { ( 0, 0, 0 ) 0.90, 0.10; ( 0, 0, 1 ) 0.70, 0.30; ( 0, 1, 0 ) 0.60, 0.40; ( 0, 1, 1 ) 0.45, 0.55; ( 1, 0, 0 ) 0.50, 0.50; ( 1, 0, 1 ) 0.35, 0.65; ( 1, 1, 0 ) 0.30, 0.70; ( 1, 1, 1 ) 0.10, 0.90; }
        probability ( Reduce_Fractions_To_Simplest | Add_Subtract_Dissimilar_Proper_Fractions ) { ( 0 ) 0.7, 0.3; ( 1 ) 0.2, 0.8; }
        probability ( Read_Write_Decimals_To_Hundredths ) { table 0.15, 0.85; }
        probability ( Plot_Decimals_Tenths_Number_Line | Read_Write_Decimals_To_Hundredths ) { ( 0 ) 0.70, 0.30; ( 1 ) 0.20, 0.80; }
        probability ( Determine_Place_Value_Digit_Value_And_Digit | Plot_Decimals_Tenths_Number_Line ) { ( 0 ) 0.70, 0.30; ( 1 ) 0.20, 0.80; }
        probability ( Compare_Order_Decimals_To_Hundredths | Determine_Place_Value_Digit_Value_And_Digit ) { ( 0 ) 0.70, 0.30; ( 1 ) 0.15, 0.85; }
        probability ( Represent_Decimals_Models_Relate_To_Fractions | Compare_Order_Decimals_To_Hundredths ) { ( 0 ) 0.70, 0.30; ( 1 ) 0.20, 0.80; }
        probability ( Convert_Decimals_Fractions_Denoms_10_to_100 | Reduce_Fractions_To_Simplest, Represent_Decimals_Models_Relate_To_Fractions ) { ( 0, 0 ) 0.85, 0.15; ( 0, 1 ) 0.50, 0.50; ( 1, 0 ) 0.55, 0.45; ( 1, 1 ) 0.15, 0.85; }
        probability ( Fractions | Convert_Decimals_Fractions_Denoms_10_to_100 ) { ( 0 ) 0.75, 0.25; ( 1 ) 0.1, 0.90; }
    """),

    "counting.bif": textwrap.dedent("""
        network Counting_BN {}

        variable Counting_Numeracy { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_1000000 { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_100000 { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_10000 { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_1000 { type discrete [ 2 ] { 0, 1 }; }
        variable Read_Write_100 { type discrete [ 2 ] { 0, 1 }; }
        variable Recognize_Represent_1000 { type discrete [ 2 ] { 0, 1 }; }
        variable Recognize_Represent_100 { type discrete [ 2 ] { 0, 1 }; }
        variable Count_Repeated_Addition { type discrete [ 2 ] { 0, 1 }; }
        variable Count_By_Steps_1000 { type discrete [ 2 ] { 0, 1 }; }
        variable Count_Up_1000 { type discrete [ 2 ] { 0, 1 }; }
        variable Count_By_Steps_100 { type discrete [ 2 ] { 0, 1 }; }
        variable Count_Up_100 { type discrete [ 2 ] { 0, 1 }; }

        probability ( Read_Write_100 ) { table 0.2, 0.8; }
        probability ( Read_Write_1000 | Read_Write_100 ) { (0) 0.8, 0.2; (1) 0.3, 0.7; }
        probability ( Read_Write_10000 | Read_Write_1000 ) { (0) 0.85, 0.15; (1) 0.25, 0.75; }
        probability ( Read_Write_100000 | Read_Write_10000 ) { (0) 0.85, 0.15; (1) 0.3, 0.7; }
        probability ( Read_Write_1000000 | Read_Write_100000 ) { (0) 0.8, 0.2; (1) 0.35, 0.65; }
        probability ( Recognize_Represent_100 ) { table 0.25, 0.75; }
        probability ( Count_Up_100 ) { table 0.15, 0.85; }
        probability ( Recognize_Represent_1000 | Recognize_Represent_100 ) { (0) 0.8, 0.2; (1) 0.25, 0.75; }
        probability ( Count_By_Steps_100 | Recognize_Represent_100, Count_Up_100 ) { (0, 0) 0.9, 0.1; (0, 1) 0.65, 0.35; (1, 0) 0.55, 0.45; (1, 1) 0.35, 0.65; }
        probability ( Count_Up_1000 | Count_By_Steps_100 ) { (0) 0.8, 0.2; (1) 0.2, 0.8; }
        probability ( Count_By_Steps_1000 | Recognize_Represent_1000, Count_Up_1000 ) { (0, 0) 0.9, 0.1; (0, 1) 0.75, 0.25; (1, 0) 0.6, 0.4; (1, 1) 0.4, 0.6; }
        probability ( Count_Repeated_Addition | Count_By_Steps_1000 ) { (0) 0.8, 0.2; (1) 0.2, 0.8; }
        probability ( Counting_Numeracy | Read_Write_1000000, Count_Repeated_Addition ) { (0, 0) 0.8, 0.2; (0, 1) 0.5, 0.5; (1, 0) 0.65, 0.35; (1, 1) 0.2, 0.8; }
    """)
}

def reset_all_bifs():
    """
    Connects to the database and updates or inserts all BIF files
    with their known-good, complete content.
    """
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("--- Attempting to reset all BIF files in the database ---")
        
        for bif_name, bif_content in VALID_BIF_TEMPLATES.items():
            # Use textwrap.dedent to remove leading whitespace from the strings
            clean_content = textwrap.dedent(bif_content)

            # Check if the network already exists
            cursor.execute("SELECT name FROM bayesian_networks WHERE name = ?", (bif_name,))
            result = cursor.fetchone()
            
            if result:
                # If it exists, update its content
                cursor.execute(
                    "UPDATE bayesian_networks SET content = ? WHERE name = ?",
                    (clean_content, bif_name)
                )
                print(f"✅ Updated content for '{bif_name}'.")
            else:
                # If it doesn't exist, insert it
                cursor.execute(
                    "INSERT INTO bayesian_networks (name, content) VALUES (?, ?)",
                    (bif_name, clean_content)
                )
                print(f"✅ Inserted new content for '{bif_name}'.")

        conn.commit()
        print("\n--- Database reset complete. ---")
            
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    reset_all_bifs()
    print("\nIMPORTANT:")
    print("1. Your local 'database.db' has been fixed with the complete BIF data.")
    print("2. You MUST now commit the updated 'database.db' file to your Git repository.")
    print("3. Redeploy your application on Render to use the fixed database.")