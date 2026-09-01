const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    email:{type:String,required:true, unique:true},
    password:{type:String,required:true},
    role:{type:String,enum:['freelancer','client']},
    failedLoginAttempts:{type:Number,default:0},
    lockUntil:{type:Data}
});

module.exports = mongoose.model('User',userSchema);