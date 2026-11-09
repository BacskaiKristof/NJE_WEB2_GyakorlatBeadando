require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const site = require("./config/site");
const app = express();
mongoose.connect(process.env.MONGO_URI);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.SESSION_MONGO_URI, collectionName: "sessions"})
}));

// Közös változók minden nézethez (a MiniStore téma fejléce és lábléce használja)
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
    req.session.message = "";
    req.session.messageType = "";
    next();
});

app.locals.site = site;

app.use("/", require("./routes/mainRouter"));

// 404
app.use((req, res) => {
    res.status(404).render("404", { title: "Az oldal nem található" });
});

const port = 3000;
app.listen(port, () => {console.log(`Server: http://localhost:${port}`);});
