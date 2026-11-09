require("dotenv").config({ quiet: true });
const path = require("path");
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const connectDB = require("./config/db");
const { seedIfEmpty } = require("./seed/seedData");
const site = require("./config/site");

if (!process.env.SESSION_SECRET) {
    console.error("Hiányzik a SESSION_SECRET környezeti változó (tetszőleges hosszú, titkos szöveg). " +
        "Helyben a .env fájlba, Render.com-on az Environment beállításokba kell felvenni.");
    process.exit(1);
}

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1); // Render.com proxy mögött fut

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session-alapú autentikáció, a session adatok MongoDB-ben (connect-mongo)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.SESSION_MONGO_URI || connectDB.MONGO_URI,
        dbName: connectDB.DB_NAME,
        collectionName: "sessions"
    }),
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 } // 1 nap
}));

// Közös változók minden nézethez + flash üzenet kezelése
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.message = req.session.message || "";
    res.locals.messageType = req.session.messageType || "danger";
    res.locals.currentPath = req.path;
    res.locals.title = "";
    // Aktív menüpont: isActive('/adatbazis') -> "active" vagy ""
    res.locals.isActive = (...paths) => paths.some((p) =>
        p === "/" ? req.path === "/" : req.path.startsWith(p)
    ) ? "active" : "";
    res.locals.roleLabel = req.session.user && req.session.user.role === "admin" ? "admin" : "regisztrált látogató";
    res.locals.pageTitle = (t) => (t ? t + " | " : "") + site.name;
    if (req.session.message) {
        delete req.session.message;
        delete req.session.messageType;
    }
    next();
});

// Formázó segédfüggvények a nézetekhez
app.locals.site = site;
app.locals.fmt = {
    ar: (n) => Number(n).toLocaleString("hu-HU") + " Ft",
    szam: (n) => Number(n).toLocaleString("hu-HU"),
    memoria: (mb) => (mb >= 1024 ? (mb / 1024).toLocaleString("hu-HU") + " GB" : mb + " MB"),
    datum: (d) => new Date(d).toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })
};

app.use("/", require("./routes/mainRouter"));

// 404
app.use((req, res) => {
    res.status(404).render("404", { title: "Az oldal nem található" });
});

// Hibakezelő
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render("error", { title: "Hiba történt" });
});

const port = process.env.PORT || 3000;
// Kapcsolódás, majd üres adatbázis esetén automatikus feltöltés a data/*.json fájlokból
connectDB()
    .then(() => seedIfEmpty())
    .then(() => {
        app.listen(port, () => { console.log(`Server: http://localhost:${port}`); });
    })
    .catch((err) => {
        console.error("Indítási hiba:", err.message);
        process.exit(1);
    });
