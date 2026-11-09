// Adatbázis feltöltése a JSON fájlokból: npm run seed
// - a gep, processzor, oprendszer kollekciókat törli és újratölti a data/*.json-ból
// - létrehoz egy admin felhasználót, ha még nincs (alapból admin / admin123)
// A felhasználókat és az üzeneteket NEM törli.
require("dotenv").config({ quiet: true });
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Gep = require("../models/Gep");
const Processzor = require("../models/Processzor");
const Oprendszer = require("../models/Oprendszer");
const User = require("../models/User");

const load = (file) => require(path.join(__dirname, "..", "data", file));

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Kapcsolódva:", mongoose.connection.name);

        const tables = [
            [Oprendszer, "oprendszer.json"],
            [Processzor, "processzor.json"],
            [Gep, "gep.json"]
        ];
        for (const [Model, file] of tables) {
            const docs = load(file);
            await Model.deleteMany({});
            await Model.insertMany(docs);
            await Model.syncIndexes();
            console.log(`${Model.collection.name}: ${docs.length} dokumentum betöltve`);
        }

        const adminName = process.env.ADMIN_USERNAME || "admin";
        const adminPass = process.env.ADMIN_PASSWORD || "admin123";
        const existing = await User.findOne({ username: adminName });
        if (existing) {
            if (existing.role !== "admin") {
                existing.role = "admin";
                await existing.save();
                console.log(`"${adminName}" felhasználó admin szerepkört kapott`);
            } else {
                console.log(`Admin felhasználó már létezik: ${adminName}`);
            }
        } else {
            const hash = await bcrypt.hash(adminPass, 10);
            await User.create({ username: adminName, password: hash, role: "admin" });
            console.log(`Admin felhasználó létrehozva: ${adminName} / ${adminPass}`);
        }
    } catch (err) {
        console.error("Seed hiba:", err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
