const mongoose = requre('mongoose');

const bookingSchema = new mongoose.Schema({
    gigId:{type:mongoose.Schema.Types.ObjectId, ref:'Gig', required:true},
    clientId:{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    freelancer:{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    amount:{type: Number, required:true},
    maskedCard:{type:String, required:true},
    createdAt:{type:Data, default:Date.now}
});

module.exports = mongoose.model('Booking',bookingSchema);