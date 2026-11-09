const mongoose = require("mongoose");


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
