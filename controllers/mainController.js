const User = require("../models/User");
const Gep = require("../models/Gep");
const Processzor = require("../models/Processzor");
const Oprendszer = require("../models/Oprendszer");
const Uzenet = require("../models/Uzenet");
const bcrypt = require("bcrypt");
const flash = require("../utils/flash");
const { MERETEK } = require("./dataController");


exports.homeIndex = async (req, res) => {
    const [gepDb, procDb, osDb, keszlet, gyartok, kiemelt, kicsi, kozepes, nagy] = await Promise.all([
        Gep.countDocuments(),
        Processzor.countDocuments(),
        Oprendszer.countDocuments(),
        Gep.find().select("db").lean(),
        Gep.distinct("gyarto"),
        
        Gep.find({ db: { $gt: 0 } })
            .sort({ memoria: -1, merevlemez: -1, ar: 1 })
            .limit(8)
            .populate("processzor")
            .lean(),
       
        Gep.countDocuments(MERETEK.kicsi),
        Gep.countDocuments(MERETEK.kozepes),
        Gep.countDocuments(MERETEK.nagy)
    ]);
    res.render("home", {
        title: "Főoldal",
        stat: {
            gep: gepDb,
            processzor: procDb,
            oprendszer: osDb,
            
            gyarto: new Set(gyartok.map((g) => g.toUpperCase())).size,
            keszlet: keszlet.reduce((ossz, g) => ossz + g.db, 0)
        },
        kiemelt,
        meretDb: { kicsi, kozepes, nagy }
    });
};

exports.userIndex = (req, res) => {
    res.render("user", { title: "Saját oldal" });
};

exports.adminIndex = async (req, res) => {
    const [gepDb, userDb, uzenetDb] = await Promise.all([
        Gep.countDocuments(),
        User.countDocuments(),
        Uzenet.countDocuments()
    ]);
    res.render("admin", { title: "Admin oldal", stat: { gep: gepDb, user: userDb, uzenet: uzenetDb } });
};


exports.registerGet = (req, res) => {
    res.render("register", { title: "Regisztráció" });
};

exports.registerPost = async (req, res) => {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (username.length < 3 || password.length < 4) {
        flash(req, "A felhasználónév legalább 3, a jelszó legalább 4 karakter legyen!");
        return res.redirect("/register");
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        flash(req, "Már van ilyen felhasználó!");
        return res.redirect("/register");
    }
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash, role: "user" });
    flash(req, "Sikeres regisztráció! Most már bejelentkezhetsz.", "success");
    res.redirect("/login");
};



exports.loginGet = (req, res) => {
    res.render("login", { title: "Bejelentkezés" });
};

exports.loginPost = async (req, res) => {
    const user = await User.findOne({ username: (req.body.username || "").trim() });
    if (!user) {
        flash(req, "Nem sikerült a bejelentkezés!");
        return res.redirect("/login");
    }
    const ok = await bcrypt.compare(req.body.password || "", user.password);
    if (!ok) {
        flash(req, "Nem sikerült a bejelentkezés!");
        return res.redirect("/login");
    }
    req.session.user = { id: user._id, username: user.username, role: user.role };
    if (user.role === "admin") {
        res.redirect("/admin");
    } else {
        res.redirect("/user");
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => { res.redirect("/"); });
};
