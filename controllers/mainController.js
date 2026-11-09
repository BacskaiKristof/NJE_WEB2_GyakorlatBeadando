const User = require("../models/User");
const bcrypt = require("bcrypt");
const flash = require("../utils/flash");

// ---------- Oldalak ----------

exports.homeIndex = (req, res) => {
    res.render("home", { title: "Főoldal" });
};

exports.userIndex = (req, res) => {
    res.render("user", { title: "Saját oldal" });
};

exports.adminIndex = (req, res) => {
    res.render("admin", { title: "Admin oldal" });
};

// ---------- Regisztráció ----------

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

// ---------- Bejelentkezés / kijelentkezés ----------

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
