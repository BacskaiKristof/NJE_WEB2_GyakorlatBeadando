const Uzenet = require("../models/Uzenet");
const flash = require("../utils/flash");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Szerver oldali validáció – a hibákat mezőnként adja vissza
const validate = (body) => {
    const data = {
        nev: (body.nev || "").trim(),
        email: (body.email || "").trim(),
        targy: (body.targy || "").trim(),
        uzenet: (body.uzenet || "").trim()
    };
    const errors = {};

    if (!data.nev) errors.nev = "A név megadása kötelező.";
    else if (data.nev.length < 2 || data.nev.length > 100) errors.nev = "A név 2–100 karakter hosszú lehet.";

    if (!data.email) errors.email = "Az e-mail cím megadása kötelező.";
    else if (!EMAIL_RE.test(data.email) || data.email.length > 150) errors.email = "Érvénytelen e-mail cím.";

    if (!data.targy) errors.targy = "A tárgy megadása kötelező.";
    else if (data.targy.length < 3 || data.targy.length > 150) errors.targy = "A tárgy 3–150 karakter hosszú lehet.";

    if (!data.uzenet) errors.uzenet = "Az üzenet megadása kötelező.";
    else if (data.uzenet.length < 10) errors.uzenet = "Az üzenet legalább 10 karakter legyen.";
    else if (data.uzenet.length > 2000) errors.uzenet = "Az üzenet legfeljebb 2000 karakter lehet.";

    return { data, errors };
};

// GET /kapcsolat
exports.form = (req, res) => {
    const user = req.session.user;
    res.render("kapcsolat", {
        title: "Kapcsolat",
        values: { nev: user ? user.username : "", email: "", targy: "", uzenet: "" },
        errors: {}
    });
};

// POST /kapcsolat
exports.send = async (req, res) => {
    const { data, errors } = validate(req.body);

    if (Object.keys(errors).length > 0) {
        return res.status(400).render("kapcsolat", {
            title: "Kapcsolat",
            values: data,
            errors,
            message: "Az üzenet nem került elküldésre, javítsd a hibás mezőket!",
            messageType: "danger"
        });
    }

    await Uzenet.create({
        ...data,
        felhasznalo: req.session.user ? req.session.user.username : null
    });
    flash(req, "Köszönjük, az üzenetedet elmentettük!", "success");
    res.redirect("/kapcsolat");
};

// GET /uzenetek – fordított időrendben (legfrissebb elöl)
exports.list = async (req, res) => {
    const uzenetek = await Uzenet.find().sort({ createdAt: -1 }).lean();
    res.render("uzenetek", { title: "Üzenetek", uzenetek });
};
