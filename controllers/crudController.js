const Gep = require("../models/Gep");
const flash = require("../utils/flash");

const PER_PAGE = 20;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

// DELETE
exports.remove = async (req, res) => {
    const id = Number(req.params.id);
    const result = await Gep.deleteOne({ id });
    if (result.deletedCount === 1) flash(req, `A(z) ${id}. notebook törölve.`, "success");
    else flash(req, "A törlendő notebook nem található.");
    res.redirect("/crud");
};
