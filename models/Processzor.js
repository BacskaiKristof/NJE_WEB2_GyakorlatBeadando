const mongoose = require("mongoose");

// processzor tábla (processzor.json)
const processzorSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    gyarto: { type: String, required: true, trim: true },
    tipus: { type: String, required: true, trim: true }
});

// 3. paraméter: a kollekció neve pontosan "processzor" legyen (ne "processzors")
module.exports = mongoose.model("Processzor", processzorSchema, "processzor");
