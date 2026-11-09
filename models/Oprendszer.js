const mongoose = require("mongoose");

// oprendszer tábla (oprendszer.json)
const oprendszerSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nev: { type: String, required: true, trim: true }
});

module.exports = mongoose.model("Oprendszer", oprendszerSchema, "oprendszer");
