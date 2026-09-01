const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
    title:{},
    description:{},
    price:{},
    freelancerId:{}
});

module.exports= mongoose.model('Gig',gigSchema);