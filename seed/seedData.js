// Adatbetöltés a data/*.json fájlokból – ezt használja az app indításkor és az npm run seed is.
const path = require("path");
const bcrypt = require("bcrypt");

const Gep = require("../models/Gep");
const Processzor = require("../models/Processzor");
const Oprendszer = require("../models/Oprendszer");
const User = require("../models/User");

const load = (file) => require(path.join(__dirname, "..", "data", file));

const TABLES = [
    [Oprendszer, "oprendszer.json"],
    [Processzor, "processzor.json"],
    [Gep, "gep.json"]
];

// A 3 tábla betöltése. force=false: csak az üres táblákat tölti fel (a meglévő adatot nem bántja),
// force=true: törli és újratölti mindhármat.
async function loadTables({ force = false } = {}) {
    for (const [Model, file] of TABLES) {
        const count = await Model.countDocuments();
        if (count > 0 && !force) {
            console.log(`${Model.collection.name}: már van benne ${count} dokumentum, kimarad`);
            continue;
        }
        const docs = load(file);
        if (force) await Model.deleteMany({});
        await Model.insertMany(docs);
        await Model.syncIndexes();
        console.log(`${Model.collection.name}: ${docs.length} dokumentum betöltve`);
    }
}

// Admin felhasználó létrehozása, ha még nincs (alapból admin / admin123)
async function ensureAdmin() {
    const adminName = process.env.ADMIN_USERNAME || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";
    const existing = await User.findOne({ username: adminName });
    if (!existing) {
        const hash = await bcrypt.hash(adminPass, 10);
        await User.create({ username: adminName, password: hash, role: "admin" });
        console.log(`Admin felhasználó létrehozva: ${adminName}`);
    } else if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log(`"${adminName}" felhasználó admin szerepkört kapott`);
    }
}

// Indításkor: üres adatbázis esetén mindent feltölt, különben nem változtat semmin.
async function seedIfEmpty() {
    await loadTables({ force: false });
    await ensureAdmin();
}

module.exports = { loadTables, ensureAdmin, seedIfEmpty };
