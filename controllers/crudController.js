const Gep = require("../models/Gep");
const Processzor = require("../models/Processzor");
const Oprendszer = require("../models/Oprendszer");
const flash = require("../utils/flash");

const PER_PAGE = 20;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Legördülő listák adatai az űrlaphoz
const listak = async () => {
    const [processzorok, oprendszerek] = await Promise.all([
        Processzor.find().sort({ gyarto: 1, tipus: 1 }).lean(),
        Oprendszer.find().sort({ nev: 1 }).lean()
    ]);
    return { processzorok, oprendszerek };
};

// Űrlap adatainak szerver oldali ellenőrzése
const validate = async (body) => {
    const str = (v) => (v || "").toString().trim();
    const num = (v) => (str(v) === "" ? NaN : Number(str(v).replace(",", ".")));

    const data = {
        gyarto: str(body.gyarto),
        tipus: str(body.tipus),
        kijelzo: num(body.kijelzo),
        memoria: num(body.memoria),
        merevlemez: num(body.merevlemez),
        videovezerlo: str(body.videovezerlo),
        ar: num(body.ar),
        processzorid: num(body.processzorid),
        oprendszerid: num(body.oprendszerid),
        db: num(body.db)
    };
    const errors = {};

    if (!data.gyarto) errors.gyarto = "A gyártó megadása kötelező.";
    else if (data.gyarto.length > 50) errors.gyarto = "Legfeljebb 50 karakter.";

    if (!data.tipus) errors.tipus = "A típus megadása kötelező.";
    else if (data.tipus.length > 100) errors.tipus = "Legfeljebb 100 karakter.";

    if (isNaN(data.kijelzo) || data.kijelzo < 5 || data.kijelzo > 25) errors.kijelzo = "5 és 25 col közötti szám.";
    if (!Number.isInteger(data.memoria) || data.memoria < 128 || data.memoria > 131072) errors.memoria = "128 és 131072 MB közötti egész szám.";
    if (!Number.isInteger(data.merevlemez) || data.merevlemez < 1 || data.merevlemez > 100000) errors.merevlemez = "1 és 100000 GB közötti egész szám.";

    if (!data.videovezerlo) errors.videovezerlo = "A videóvezérlő megadása kötelező.";
    else if (data.videovezerlo.length > 100) errors.videovezerlo = "Legfeljebb 100 karakter.";

    if (!Number.isInteger(data.ar) || data.ar < 0 || data.ar > 100000000) errors.ar = "Nem negatív egész szám (Ft).";
    if (!Number.isInteger(data.db) || data.db < 0 || data.db > 100000) errors.db = "Nem negatív egész szám.";

    if (!Number.isInteger(data.processzorid) || !(await Processzor.exists({ id: data.processzorid }))) {
        errors.processzorid = "Válassz processzort a listából.";
    }
    if (!Number.isInteger(data.oprendszerid) || !(await Oprendszer.exists({ id: data.oprendszerid }))) {
        errors.oprendszerid = "Válassz operációs rendszert a listából.";
    }

    return { data, errors };
};

// READ – lista kereséssel és lapozással
exports.index = async (req, res) => {
    const kereses = (req.query.q || "").trim();
    const filter = {};
    if (kereses) {
        const re = new RegExp(escapeRegex(kereses), "i");
        filter.$or = [{ gyarto: re }, { tipus: re }, { videovezerlo: re }];
    }
    const total = await Gep.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(Math.max(1, parseInt(req.query.oldal) || 1), pages);

    const gepek = await Gep.find(filter)
        .sort({ id: -1 })
        .skip((page - 1) * PER_PAGE)
        .limit(PER_PAGE)
        .populate("processzor")
        .populate("oprendszer")
        .lean();

    const params = new URLSearchParams();
    if (kereses) params.set("q", kereses);

    res.render("crud", { title: "CRUD – Notebookok", gepek, kereses, total, page, pages, baseQuery: params.toString() });
};

// CREATE – űrlap
exports.newForm = async (req, res) => {
    res.render("crud-form", {
        title: "Új notebook",
        mode: "uj",
        gep: { gyarto: "", tipus: "", kijelzo: "", memoria: "", merevlemez: "", videovezerlo: "", ar: "", processzorid: "", oprendszerid: "", db: 0 },
        errors: {},
        ...(await listak())
    });
};

// CREATE – mentés
exports.create = async (req, res) => {
    const { data, errors } = await validate(req.body);
    if (Object.keys(errors).length > 0) {
        return res.status(400).render("crud-form", {
            title: "Új notebook", mode: "uj", gep: { ...req.body }, errors,
            message: "Hibás adatok, a notebook nem került mentésre!", messageType: "danger",
            ...(await listak())
        });
    }
    const utolso = await Gep.findOne().sort({ id: -1 }).select("id").lean();
    data.id = utolso ? utolso.id + 1 : 1;
    await Gep.create(data);
    flash(req, `Az új notebook (${data.gyarto} ${data.tipus}) mentve, azonosító: ${data.id}.`, "success");
    res.redirect("/crud");
};

// UPDATE – űrlap
exports.editForm = async (req, res, next) => {
    const gep = await Gep.findOne({ id: Number(req.params.id) }).lean();
    if (!gep) return next(); // 404
    res.render("crud-form", { title: "Notebook szerkesztése", mode: "szerkesztes", gep, errors: {}, ...(await listak()) });
};

// UPDATE – mentés
exports.update = async (req, res, next) => {
    const id = Number(req.params.id);
    const gep = await Gep.findOne({ id }).lean();
    if (!gep) return next();

    const { data, errors } = await validate(req.body);
    if (Object.keys(errors).length > 0) {
        return res.status(400).render("crud-form", {
            title: "Notebook szerkesztése", mode: "szerkesztes", gep: { ...req.body, id }, errors,
            message: "Hibás adatok, a módosítás nem került mentésre!", messageType: "danger",
            ...(await listak())
        });
    }
    await Gep.updateOne({ id }, data, { runValidators: true });
    flash(req, `A(z) ${id}. notebook adatai módosítva.`, "success");
    res.redirect("/crud");
};

// DELETE
exports.remove = async (req, res) => {
    const id = Number(req.params.id);
    const result = await Gep.deleteOne({ id });
    if (result.deletedCount === 1) flash(req, `A(z) ${id}. notebook törölve.`, "success");
    else flash(req, "A törlendő notebook nem található.");
    res.redirect("/crud");
};
