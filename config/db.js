const mongoose = require("mongoose");

// Az adatbázis neve. Ha a kapcsolati stringben nincs (vagy más van), akkor is ezt használjuk,
// különben a MongoDB a "test" adatbázisba írna.
const DB_NAME = process.env.DB_NAME || "notebook";

// A kapcsolati string: MONGO_URI vagy MONGODB_URI néven is megadható.
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Az auth projektből átvett adatbázis-kapcsolódás (config/db.js).
const connectDB = async () => {
    if (!MONGO_URI) {
        console.error("Hiányzik a MONGO_URI (vagy MONGODB_URI) környezeti változó (a MongoDB kapcsolati string). " +
            "Helyben a .env fájlba, Render.com-on az Environment beállításokba kell felvenni.");
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log("MongoDB is connected:", mongoose.connection.name);
    } catch (err) {
        console.error("MongoDB error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
module.exports.DB_NAME = DB_NAME;
module.exports.MONGO_URI = MONGO_URI;
