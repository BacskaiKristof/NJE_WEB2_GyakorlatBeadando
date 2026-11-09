// Adatbázis újratöltése kézzel: npm run seed
// - a gep, processzor, oprendszer kollekciókat törli és újratölti a data/*.json-ból
// - létrehoz egy admin felhasználót, ha még nincs (alapból admin / admin123)
// A felhasználókat és az üzeneteket NEM törli.

require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { loadTables, ensureAdmin } = require("./seedData");

(async () => {
    try {
        await connectDB();
        await loadTables({ force: true });
        await ensureAdmin();
    } catch (err) {
        console.error("Seed hiba:", err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
