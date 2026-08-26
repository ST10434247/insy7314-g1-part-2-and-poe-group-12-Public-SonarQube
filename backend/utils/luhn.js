//Validate credit card using Mod 10 aka Luhn Algorithm
const validateLuhn = (cardNumber) =>{
    const sanitized = cardNumber.replace(/\D/g, '');
    if(!sanitized || sanitized.length <13 || sanitized.length >19) return false;

    let sum =0;
    let shouldDouble = false;

    for(let i = sanitized.length-1;i>=0; i--){
        let didgit = parseInt(sanitized.charAT(i),10);

        if(shouldDouble){
            digit *=2;
            if(digit >9) digit -=9;
        }
        sum += didgit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 ===0
};

const getCardType = (cardNumber) =>{
    const sanitized = cardNumber.replace(/\D/g,'');
    if(/^4/.test(sanitized)) return 'Visa';
    if(/^(5[1-5]|2[2-7])/.test(sanitized)) return 'Mastercard';
};
module.export = (validateLuhn,getCardType);
