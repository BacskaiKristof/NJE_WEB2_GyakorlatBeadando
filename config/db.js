const mongoose = require("mongoose");

// Az auth projektből átvett adatbázis-kapcsolódás (config/db.js).
// Most már ténylegesen ezt használja az app.js is.
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB is connected:", mongoose.connection.name);
    } catch (err) {
        console.error("MongoDB error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
