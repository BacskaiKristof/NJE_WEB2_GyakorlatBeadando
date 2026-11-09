const mongoose = require("mongoose");

// gep tábla (gep.json) – a notebookok
const gepSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    gyarto: { type: String, required: true, trim: true },
    tipus: { type: String, required: true, trim: true },
    kijelzo: { type: Number, required: true, min: 0 },      // col
    memoria: { type: Number, required: true, min: 0 },      // MB
    merevlemez: { type: Number, required: true, min: 0 },   // GB
    videovezerlo: { type: String, required: true, trim: true },
    ar: { type: Number, required: true, min: 0 },           // Ft
    processzorid: { type: Number, required: true },
    oprendszerid: { type: Number, required: true },
    db: { type: Number, required: true, min: 0 }            // készlet
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Kapcsolatok a másik két táblához (virtual populate az "id" mezők alapján).
// Így a .populate("processzor") és .populate("oprendszer") hívás
// behúzza a kapcsolódó dokumentumot – SQL JOIN megfelelője az ODM-ben.
gepSchema.virtual("processzor", {
    ref: "Processzor",
    localField: "processzorid",
    foreignField: "id",
    justOne: true
});

gepSchema.virtual("oprendszer", {
    ref: "Oprendszer",
    localField: "oprendszerid",
    foreignField: "id",
    justOne: true
});

module.exports = mongoose.model("Gep", gepSchema, "gep");
