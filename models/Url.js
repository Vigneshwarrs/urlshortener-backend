const mongoose = require('mongoose');

// Create a url schema object
const urlSchema = new mongoose.Schema({
    originalURL: { type: String, required: true },
    shortURL: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true}
}, {timestamps: true});

module.exports = mongoose.model('Url', urlSchema);