import React, { useState } from 'react';
// import estimateStructure from '../components/estimate_structure.png';
// import orderingStructure from '../components/ordering_structure.png';
// import comparingStructure from '../components/comparing_structure.png';
// import moneyStructure from '../components/money_structure.png';
// import placeStructure from '../components/place_structure.png';
// import countingStructure from '../components/counting_structure.png';

// Import simplified images
import estimateSimplified from '../components/estimate_simplified.png';
import orderingSimplified from '../components/ordering_simplified.png';
import comparingSimplified from '../components/comparing_simplified.png';
import moneySimplified from '../components/money_simplified.png';
import placeSimplified from '../components/place_simplified.png';
import countingSimplified from '../components/counting_simplified.png';

const structureImages = {
  // estimate: estimateStructure,
  // ordering: orderingStructure,
  // comparing: comparingStructure,
  // money: moneyStructure,
  // place_value: placeStructure,
  // counting: countingStructure,
};

const simplifiedStructureImages = {
  estimate: estimateSimplified,
  ordering: orderingSimplified,
  comparing: comparingSimplified,
  money: moneySimplified,
  place_value: placeSimplified,
  counting: countingSimplified,
};

function TeacherBayesOverview() {
  const [selectedBif, setSelectedBif] = useState('estimate');
  const [mode, setMode] = useState('simplified'); // Add mode state

  const handleBifChange = (event) => {
    setSelectedBif(event.target.value);
  };

  const handleModeChange = (event) => {
    setMode(event.target.value);
  };

  const structureImage = mode === 'simplified'
    ? simplifiedStructureImages[selectedBif]
    : structureImages[selectedBif];

  const hardcodedTableEstimate = (
    <div style={{ marginTop: '1rem' }}>
      <h3>Conditional Probability Distributions (CPDs) for Estimate</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Node</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Given Parent States</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>CPD Values</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Estimation | Multiply_Two_Numbers, Quotient_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers=0, Quotient_Using_Multiples=0</td>
            <td style={{ padding: '8px' }}>[0.8, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Estimation | Multiply_Two_Numbers, Quotient_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers=0, Quotient_Using_Multiples=1</td>
            <td style={{ padding: '8px' }}>[0.35, 0.65]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Estimation | Multiply_Two_Numbers, Quotient_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers=1, Quotient_Using_Multiples=0</td>
            <td style={{ padding: '8px' }}>[0.6, 0.4]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Estimation | Multiply_Two_Numbers, Quotient_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers=1, Quotient_Using_Multiples=1</td>
            <td style={{ padding: '8px' }}>[0.2, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers | Sum_Difference_Rounding, Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding=0, Product_Using_Multiples=0</td>
            <td style={{ padding: '8px' }}>[0.85, 0.15]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers | Sum_Difference_Rounding, Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding=0, Product_Using_Multiples=1</td>
            <td style={{ padding: '8px' }}>[0.45, 0.55]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers | Sum_Difference_Rounding, Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding=1, Product_Using_Multiples=0</td>
            <td style={{ padding: '8px' }}>[0.7, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Multiply_Two_Numbers | Sum_Difference_Rounding, Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding=1, Product_Using_Multiples=1</td>
            <td style={{ padding: '8px' }}>[0.25, 0.75]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Divide_2_3_Digit_Numbers | Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Product_Using_Multiples=0</td>
            <td style={{ padding: '8px' }}>[0.8, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Divide_2_3_Digit_Numbers | Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>Product_Using_Multiples=1</td>
            <td style={{ padding: '8px' }}>[0.4, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.7</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Product_Using_Multiples</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.3</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Quotient_Using_Multiples | Divide_2_3_Digit_Numbers</td>
            <td style={{ padding: '8px' }}>Divide_2_3_Digit_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.8, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Quotient_Using_Multiples | Divide_2_3_Digit_Numbers</td>
            <td style={{ padding: '8px' }}>Divide_2_3_Digit_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.4, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding | Sum_Up_To_4_Digits, Difference_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>Sum_Up_To_4_Digits=0, Difference_Up_To_4_Digits=0</td>
            <td style={{ padding: '8px' }}>[0.85, 0.15]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding | Sum_Up_To_4_Digits, Difference_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>Sum_Up_To_4_Digits=0, Difference_Up_To_4_Digits=1</td>
            <td style={{ padding: '8px' }}>[0.45, 0.55]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding | Sum_Up_To_4_Digits, Difference_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>Sum_Up_To_4_Digits=1, Difference_Up_To_4_Digits=0</td>
            <td style={{ padding: '8px' }}>[0.65, 0.35]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Sum_Difference_Rounding | Sum_Up_To_4_Digits, Difference_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>Sum_Up_To_4_Digits=1, Difference_Up_To_4_Digits=1</td>
            <td style={{ padding: '8px' }}>[0.25, 0.75]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Sum_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.7</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Sum_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.3</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Difference_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.7</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Difference_Up_To_4_Digits</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.3</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
  const hardcodedTableOrdering = (
    <div style={{ marginTop: '1rem' }}>
      <h3>Conditional Probability Distributions (CPDs) for Ordering</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Node</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Given Parent States</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>CPD Values</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Ordering_Numbers | Compare_Order_Decimals</td>
            <td style={{ padding: '8px' }}>Compare_Order_Decimals=0</td>
            <td style={{ padding: '8px' }}>[0.3, 0.7]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Ordering_Numbers | Compare_Order_Decimals</td>
            <td style={{ padding: '8px' }}>Compare_Order_Decimals=1</td>
            <td style={{ padding: '8px' }}>[0.7, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Order_Decimals | Order_Numbers_10k</td>
            <td style={{ padding: '8px' }}>Order_Numbers_10k=0</td>
            <td style={{ padding: '8px' }}>[0.35, 0.65]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Order_Decimals | Order_Numbers_10k</td>
            <td style={{ padding: '8px' }}>Order_Numbers_10k=1</td>
            <td style={{ padding: '8px' }}>[0.65, 0.35]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_10k | Order_Numbers_1k</td>
            <td style={{ padding: '8px' }}>Order_Numbers_1k=0</td>
            <td style={{ padding: '8px' }}>[0.4, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_10k | Order_Numbers_1k</td>
            <td style={{ padding: '8px' }}>Order_Numbers_1k=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.4]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_1k | Order_Numbers_100</td>
            <td style={{ padding: '8px' }}>Order_Numbers_100=0</td>
            <td style={{ padding: '8px' }}>[0.45, 0.55]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_1k | Order_Numbers_100</td>
            <td style={{ padding: '8px' }}>Order_Numbers_100=1</td>
            <td style={{ padding: '8px' }}>[0.55, 0.45]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_100 | Order_Numbers_20</td>
            <td style={{ padding: '8px' }}>Order_Numbers_20=0</td>
            <td style={{ padding: '8px' }}>[0.54, 0.54]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_100 | Order_Numbers_20</td>
            <td style={{ padding: '8px' }}>Order_Numbers_20=1</td>
            <td style={{ padding: '8px' }}>[0.46, 0.46]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_20</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.55</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Order_Numbers_20</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.45</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const hardcodedTableComparing = (
    <div style={{ marginTop: '1rem' }}>
      <h3>Conditional Probability Distributions (CPDs) for Comparing</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Node</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Given Parent States</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>CPD Values</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=0, Compare_Values_Bills_Coins=0, Compare_Order_Decimal_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.1, 0.25]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=0, Compare_Values_Bills_Coins=0, Compare_Order_Decimal_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.35, 0.5]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=0, Compare_Values_Bills_Coins=1, Compare_Order_Decimal_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.55, 0.4]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=0, Compare_Values_Bills_Coins=1, Compare_Order_Decimal_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.7, 0.85]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=1, Compare_Values_Bills_Coins=0, Compare_Order_Decimal_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.9, 0.75]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=1, Compare_Values_Bills_Coins=0, Compare_Order_Decimal_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.65, 0.5]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=1, Compare_Values_Bills_Coins=1, Compare_Order_Decimal_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.45, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Comparing | Compare_Numbers_One_Million, Compare_Values_Bills_Coins, Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million=1, Compare_Values_Bills_Coins=1, Compare_Order_Decimal_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.3, 0.15]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million | Compare_Numbers_Ten_Thousand</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_Ten_Thousand=0</td>
            <td style={{ padding: '8px' }}>[0.75, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Numbers_One_Million | Compare_Numbers_Ten_Thousand</td>
            <td style={{ padding: '8px' }}>Compare_Numbers_Ten_Thousand=1</td>
            <td style={{ padding: '8px' }}>[0.25, 0.4]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Numbers_Ten_Thousand | Compare_Two_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Two_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.3, 0.65]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Numbers_Ten_Thousand | Compare_Two_Numbers</td>
            <td style={{ padding: '8px' }}>Compare_Two_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.7, 0.35]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Two_Numbers</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.6</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Two_Numbers</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.4</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Values_Bills_Coins</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.55</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Values_Bills_Coins</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.45</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.6</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Order_Decimal_Numbers</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.4</td>
          </tr>
        </tbody>
      </table>
    </div>
    
  );
  const hardcodedTableMoney = (
    <div style={{ marginTop: '1rem' }}>
      <h3>Conditional Probability Distributions (CPDs) for Money</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Node</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Given Parent States</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>CPD Values</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Money | Read_Write_10k_Centavos</td>
            <td style={{ padding: '8px' }}>Read_Write_10k_Centavos=0</td>
            <td style={{ padding: '8px' }}>[0.3, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Money | Read_Write_10k_Centavos</td>
            <td style={{ padding: '8px' }}>Read_Write_10k_Centavos=1</td>
            <td style={{ padding: '8px' }}>[0.7, 0.4]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_10k_Centavos | Compare_Denom_1k, Value_Combo_1k</td>
            <td style={{ padding: '8px' }}>Compare_Denom_1k=0, Value_Combo_1k=0</td>
            <td style={{ padding: '8px' }}>[0.35, 0.5]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_10k_Centavos | Compare_Denom_1k, Value_Combo_1k</td>
            <td style={{ padding: '8px' }}>Compare_Denom_1k=0, Value_Combo_1k=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_10k_Centavos | Compare_Denom_1k, Value_Combo_1k</td>
            <td style={{ padding: '8px' }}>Compare_Denom_1k=1, Value_Combo_1k=0</td>
            <td style={{ padding: '8px' }}>[0.65, 0.5]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_10k_Centavos | Compare_Denom_1k, Value_Combo_1k</td>
            <td style={{ padding: '8px' }}>Compare_Denom_1k=1, Value_Combo_1k=1</td>
            <td style={{ padding: '8px' }}>[0.4, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Value_Combo_1k | Value_Bills_Coins_100</td>
            <td style={{ padding: '8px' }}>Value_Bills_Coins_100=0</td>
            <td style={{ padding: '8px' }}>[0.4, 0.75]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Value_Combo_1k | Value_Bills_Coins_100</td>
            <td style={{ padding: '8px' }}>Value_Bills_Coins_100=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.25]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Denom_1k | Compare_Denom_100</td>
            <td style={{ padding: '8px' }}>Compare_Denom_100=0</td>
            <td style={{ padding: '8px' }}>[0.35, 0.7]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Denom_1k | Compare_Denom_100</td>
            <td style={{ padding: '8px' }}>Compare_Denom_100=1</td>
            <td style={{ padding: '8px' }}>[0.65, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Value_Bills_Coins_100 | Value_Peso_100</td>
            <td style={{ padding: '8px' }}>Value_Peso_100=0</td>
            <td style={{ padding: '8px' }}>[0.25, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Value_Bills_Coins_100 | Value_Peso_100</td>
            <td style={{ padding: '8px' }}>Value_Peso_100=1</td>
            <td style={{ padding: '8px' }}>[0.75, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Denom_100 | Value_Peso_100</td>
            <td style={{ padding: '8px' }}>Value_Peso_100=0</td>
            <td style={{ padding: '8px' }}>[0.3, 0.7]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compare_Denom_100 | Value_Peso_100</td>
            <td style={{ padding: '8px' }}>Value_Peso_100=1</td>
            <td style={{ padding: '8px' }}>[0.7, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Value_Peso_100</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.85</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Value_Peso_100</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.15</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const hardcodedTablePlaceValue = (
    <div style={{ marginTop: '1rem' }}>
      <h3>Conditional Probability Distributions (CPDs) for Place Value</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Node</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Given Parent States</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>CPD Values</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>PlaceValueNR | Round_Numbers_Hundred_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand=0, Determine_Place_Value_6_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.9, 0.1]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>PlaceValueNR | Round_Numbers_Hundred_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand=0, Determine_Place_Value_6_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.5, 0.5]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>PlaceValueNR | Round_Numbers_Hundred_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand=1, Determine_Place_Value_6_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.4, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>PlaceValueNR | Round_Numbers_Hundred_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand=1, Determine_Place_Value_6_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.15, 0.85]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand | Round_Numbers_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Thousand=0, Determine_Place_Value_6_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.8, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand | Round_Numbers_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Thousand=0, Determine_Place_Value_6_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.4]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand | Round_Numbers_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Thousand=1, Determine_Place_Value_6_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.35, 0.65]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Round_Numbers_Hundred_Thousand | Round_Numbers_Thousand, Determine_Place_Value_6_Digit_Number</td>
            <td style={{ padding: '8px' }}>Round_Numbers_Thousand=1, Determine_Place_Value_6_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.15, 0.85]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Round_Numbers_Thousand | Determine_Place_Value_4_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_4_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.7, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Round_Numbers_Thousand | Determine_Place_Value_4_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_4_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.2, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_6_Digit_Number | Determine_Place_Value_4_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_4_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.7, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_6_Digit_Number | Determine_Place_Value_4_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_4_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.15, 0.85]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_4_Digit_Number | Determine_Place_Value_3_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_3_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.75, 0.25]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_4_Digit_Number | Determine_Place_Value_3_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_3_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.2, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_3_Digit_Number | Determine_Place_Value_2_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_2_Digit_Number=0</td>
            <td style={{ padding: '8px' }}>[0.75, 0.25]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_3_Digit_Number | Determine_Place_Value_2_Digit_Number</td>
            <td style={{ padding: '8px' }}>Determine_Place_Value_2_Digit_Number=1</td>
            <td style={{ padding: '8px' }}>[0.15, 0.85]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_2_Digit_Number | Decompose_2_Digit_Numbers</td>
            <td style={{ padding: '8px' }}>Decompose_2_Digit_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.2, 0.65]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Determine_Place_Value_2_Digit_Number | Decompose_2_Digit_Numbers</td>
            <td style={{ padding: '8px' }}>Decompose_2_Digit_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.8, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Decompose_2_Digit_Numbers | Compose_Decompose_Numbers</td>
            <td style={{ padding: '8px' }}>Compose_Decompose_Numbers=0</td>
            <td style={{ padding: '8px' }}>[0.85, 0.15]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Decompose_2_Digit_Numbers | Compose_Decompose_Numbers</td>
            <td style={{ padding: '8px' }}>Compose_Decompose_Numbers=1</td>
            <td style={{ padding: '8px' }}>[0.15, 0.85]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compose_Decompose_Numbers</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.2</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Compose_Decompose_Numbers</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.8</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
  const hardcodedTableCounting = (
    <div style={{ marginTop: '1rem' }}>
      <h3>Conditional Probability Distributions (CPDs) for Counting</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Node</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Given Parent States</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>CPD Values</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Counting_Numeracy | Read_Write_1000000, Count_Repeated_Addition</td>
            <td style={{ padding: '8px' }}>Read_Write_1000000=0, Count_Repeated_Addition=0</td>
            <td style={{ padding: '8px' }}>[0.2, 0.5]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Counting_Numeracy | Read_Write_1000000, Count_Repeated_Addition</td>
            <td style={{ padding: '8px' }}>Read_Write_1000000=0, Count_Repeated_Addition=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Counting_Numeracy | Read_Write_1000000, Count_Repeated_Addition</td>
            <td style={{ padding: '8px' }}>Read_Write_1000000=1, Count_Repeated_Addition=0</td>
            <td style={{ padding: '8px' }}>[0.8, 0.5]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Counting_Numeracy | Read_Write_1000000, Count_Repeated_Addition</td>
            <td style={{ padding: '8px' }}>Read_Write_1000000=1, Count_Repeated_Addition=1</td>
            <td style={{ padding: '8px' }}>[0.4, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_1000000 | Read_Write_100000</td>
            <td style={{ padding: '8px' }}>Read_Write_100000=0</td>
            <td style={{ padding: '8px' }}>[0.4, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_1000000 | Read_Write_100000</td>
            <td style={{ padding: '8px' }}>Read_Write_100000=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_100000 | Read_Write_10000</td>
            <td style={{ padding: '8px' }}>Read_Write_10000=0</td>
            <td style={{ padding: '8px' }}>[0.4, 0.85]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_100000 | Read_Write_10000</td>
            <td style={{ padding: '8px' }}>Read_Write_10000=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.15]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_10000 | Read_Write_1000</td>
            <td style={{ padding: '8px' }}>Read_Write_1000=0</td>
            <td style={{ padding: '8px' }}>[0.3, 0.7]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_10000 | Read_Write_1000</td>
            <td style={{ padding: '8px' }}>Read_Write_1000=1</td>
            <td style={{ padding: '8px' }}>[0.7, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_1000 | Read_Write_100</td>
            <td style={{ padding: '8px' }}>Read_Write_100=0</td>
            <td style={{ padding: '8px' }}>[0.25, 0.75]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_1000 | Read_Write_100</td>
            <td style={{ padding: '8px' }}>Read_Write_100=1</td>
            <td style={{ padding: '8px' }}>[0.75, 0.25]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_100</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.7</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Read_Write_100</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.3</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Recognize_Represent_1000 | Recognize_Represent_100</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_100=0</td>
            <td style={{ padding: '8px' }}>[0.25, 0.75]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Recognize_Represent_1000 | Recognize_Represent_100</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_100=1</td>
            <td style={{ padding: '8px' }}>[0.75, 0.25]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Recognize_Represent_100</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.8</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Recognize_Represent_100</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.2</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_Repeated_Addition | Count_By_Steps_1000</td>
            <td style={{ padding: '8px' }}>Count_By_Steps_1000=0</td>
            <td style={{ padding: '8px' }}>[0.2, 0.7]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_Repeated_Addition | Count_By_Steps_1000</td>
            <td style={{ padding: '8px' }}>Count_By_Steps_1000=1</td>
            <td style={{ padding: '8px' }}>[0.8, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_1000 | Recognize_Represent_1000, Count_Up_1000</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_1000=0, Count_Up_1000=0</td>
            <td style={{ padding: '8px' }}>[0.1, 0.3]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_1000 | Recognize_Represent_1000, Count_Up_1000</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_1000=0, Count_Up_1000=1</td>
            <td style={{ padding: '8px' }}>[0.4, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_1000 | Recognize_Represent_1000, Count_Up_1000</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_1000=1, Count_Up_1000=0</td>
            <td style={{ padding: '8px' }}>[0.9, 0.7]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_1000 | Recognize_Represent_1000, Count_Up_1000</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_1000=1, Count_Up_1000=1</td>
            <td style={{ padding: '8px' }}>[0.6, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_Up_1000 | Count_By_Steps_100</td>
            <td style={{ padding: '8px' }}>Count_By_Steps_100=0</td>
            <td style={{ padding: '8px' }}>[0.2, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_Up_1000 | Count_By_Steps_100</td>
            <td style={{ padding: '8px' }}>Count_By_Steps_100=1</td>
            <td style={{ padding: '8px' }}>[0.8, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_100 | Recognize_Represent_100, Count_Up_100</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_100=0, Count_Up_100=0</td>
            <td style={{ padding: '8px' }}>[0.1, 0.4]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_100 | Recognize_Represent_100, Count_Up_100</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_100=0, Count_Up_100=1</td>
            <td style={{ padding: '8px' }}>[0.3, 0.8]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_100 | Recognize_Represent_100, Count_Up_100</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_100=1, Count_Up_100=0</td>
            <td style={{ padding: '8px' }}>[0.9, 0.6]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_By_Steps_100 | Recognize_Represent_100, Count_Up_100</td>
            <td style={{ padding: '8px' }}>Recognize_Represent_100=1, Count_Up_100=1</td>
            <td style={{ padding: '8px' }}>[0.7, 0.2]</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_Up_100</td>
            <td style={{ padding: '8px' }}>State 0</td>
            <td style={{ padding: '8px' }}>0.85</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Count_Up_100</td>
            <td style={{ padding: '8px' }}>State 1</td>
            <td style={{ padding: '8px' }}>0.15</td>
          </tr>
        </tbody>
      </table>
    </div>
  );


 

// ...existing code...

return (
  <div>
    <h2>Bayesian Network Overview</h2>
    <p>Visualize or review the Bayesian Network structure that powers the tutoring system.</p>

    {/* Mode Selection */}
    <div style={{ marginBottom: '1rem' }}>
      <label>
        <input
          type="radio"
          value="simplified"
          checked={mode === 'simplified'}
          onChange={handleModeChange}
        />
        Simplified
      </label>
      <label style={{ marginLeft: '1rem' }}>
        <input
          type="radio"
          value="advanced"
          checked={mode === 'advanced'}
          onChange={handleModeChange}
        />
        Advanced
      </label>
    </div>

    {/* BIF Selection Dropdown */}
    <div>
      <label htmlFor="bif-select">Select BIF:</label>
      <select id="bif-select" value={selectedBif} onChange={handleBifChange}>
        <option value="estimate">Estimate</option>
        <option value="ordering">Ordering</option>
        <option value="comparing">Comparing</option>
        <option value="money">Money</option>
        <option value="place_value">Place-Value</option>
        <option value="counting">Counting</option>
      </select>
    </div>

    {/* Structure Image Display */}
    <div style={{ marginTop: "1rem" }}>
  <h3>Structure</h3>
  {structureImage ? (
    <img
      src={structureImage}
      alt={`${selectedBif} structure`}
      style={
        mode === 'simplified'
          ? selectedBif === 'ordering'
            ? { maxWidth: "600px", width: "100%", height: "auto", display: "block", margin: "0 auto" }
            : selectedBif === 'comparing'
              ? { maxWidth: "1300px", width: "100%", height: "auto", display: "block", margin: "0 auto" }
              : { maxWidth: "1000px", width: "100%", height: "auto", display: "block", margin: "0 auto" }
          : { maxWidth: "100%", height: "auto" }
      }
    />
  ) : (
    <p>No structure image available.</p>
  )}
</div>

    {/* Table Display */}
    {mode === 'advanced' && (
      <>
        {selectedBif === "estimate" && hardcodedTableEstimate}
        {selectedBif === "ordering" && hardcodedTableOrdering}
        {selectedBif === "comparing" && hardcodedTableComparing}
        {selectedBif === "money" && hardcodedTableMoney}
        {selectedBif === "place_value" && hardcodedTablePlaceValue}
        {selectedBif === "counting" && hardcodedTableCounting}
      </>
    )}
  </div>
);
}

export default TeacherBayesOverview;