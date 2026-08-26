const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
    windowMs:15*60*1000,//15 mins
    max:5,//limit each person to five failed attempts
    message:{error:'Too many attempts.Please try again after 15 minutes'}
});

module.exports = {authLimiter};
