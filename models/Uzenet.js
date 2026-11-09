const mongoose = require("mongoose");

// A Kapcsolat űrlapon küldött üzenetek
const uzenetSchema = new mongoose.Schema({
    nev: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, maxlength: 150 },
    targy: { type: String, required: true, trim: true, maxlength: 150 },
    uzenet: { type: String, required: true, trim: true, maxlength: 2000 },
    // ha bejelentkezett felhasználó küldte, a felhasználóneve
    felhasznalo: { type: String, default: null }
}, { timestamps: true }); // createdAt = küldés ideje

module.exports = mongoose.model("Uzenet", uzenetSchema, "uzenetek");
