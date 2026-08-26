const calculateTax = (grossIncome) =>{
    if(grossIncome <=10000) return 0;
    if(grossIncome <=40000) return (grossIncome -10000)*0.15;
    return 4500 + (grossIncome-40000)* 0.25;
};

module.exports = calculateTax;