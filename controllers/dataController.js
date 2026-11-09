const Gep = require("../models/Gep");
const Processzor = require("../models/Processzor");
const Oprendszer = require("../models/Oprendszer");

const PER_PAGE = 15;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const RENDEZES = {
    id: { id: 1 },
    ar_nov: { ar: 1 },
    ar_csokk: { ar: -1 },
    nev: { gyarto: 1, tipus: 1 },
    kijelzo: { kijelzo: -1 }
};


const MERETEK = {
    kicsi: { kijelzo: { $lte: 12.1 } },
    kozepes: { kijelzo: { $gt: 12.1, $lte: 15.6 } },
    nagy: { kijelzo: { $gt: 15.6 } }
};
exports.MERETEK = MERETEK;

// ---------- Adatbázis menü: mind a 3 tábla adatai ----------
exports.adatbazis = async (req, res) => {
    const q = {
        gyarto: (req.query.gyarto || "").trim(),
        procGyarto: (req.query.procGyarto || "").trim(),
        os: (req.query.os || "").trim(),
        meret: MERETEK[req.query.meret] ? req.query.meret : "",
        rendezes: RENDEZES[req.query.rendezes] ? req.query.rendezes : "id"
    };

    // Szűrőfeltétel összeállítása
    const filter = {};
    if (q.gyarto) {
        filter.gyarto = new RegExp("^" + escapeRegex(q.gyarto) + "$", "i");
    }
    if (q.os && !isNaN(Number(q.os))) {
        filter.oprendszerid = Number(q.os);
    }
    if (q.meret) {
        Object.assign(filter, MERETEK[q.meret]);
    }
    if (q.procGyarto) {
        const procIds = await Processzor.find({ gyarto: q.procGyarto }).distinct("id");
        filter.processzorid = { $in: procIds };
    }

    const total = await Gep.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(Math.max(1, parseInt(req.query.oldal) || 1), pages);

    const [gepek, processzorok, oprendszerek, gyartok, procGyartok, procHasznalat, osHasznalat] = await Promise.all([
        
        Gep.find(filter)
            .sort(RENDEZES[q.rendezes])
            .skip((page - 1) * PER_PAGE)
            .limit(PER_PAGE)
            .populate("processzor")
            .populate("oprendszer")
            .lean(),
        Processzor.find().sort({ gyarto: 1, tipus: 1 }).lean(),
        Oprendszer.find().sort({ nev: 1 }).lean(),
        Gep.distinct("gyarto"),
        Processzor.distinct("gyarto"),
        Gep.aggregate([{ $group: { _id: "$processzorid", db: { $sum: 1 } } }]),
        Gep.aggregate([{ $group: { _id: "$oprendszerid", db: { $sum: 1 } } }])
    ]);

    // Hány notebookban szerepel az adott processzor / oprendszer
    const procMap = Object.fromEntries(procHasznalat.map((x) => [x._id, x.db]));
    const osMap = Object.fromEntries(osHasznalat.map((x) => [x._id, x.db]));
    processzorok.forEach((p) => { p.gepDb = procMap[p.id] || 0; });
    oprendszerek.forEach((o) => { o.gepDb = osMap[o.id] || 0; });

    // A lapozó linkekhez a szűrők megtartása
    const params = new URLSearchParams();
    if (q.gyarto) params.set("gyarto", q.gyarto);
    if (q.procGyarto) params.set("procGyarto", q.procGyarto);
    if (q.os) params.set("os", q.os);
    if (q.meret) params.set("meret", q.meret);
    if (q.rendezes !== "id") params.set("rendezes", q.rendezes);

    res.render("adatbazis", {
        title: "Adatbázis",
        gepek,
        processzorok,
        oprendszerek,
        // nagybetűsítve egyedi lista ("Asus" és "ASUS" egy gyártó)
        gyartok: [...new Set(gyartok.map((g) => g.toUpperCase()))].sort(),
        procGyartok: procGyartok.sort(),
        q,
        total,
        page,
        pages,
        baseQuery: params.toString()
    });
};

// ---------- Diagram menü (Chart.js) ----------

exports.diagram = async (req, res) => {
    const [gepek, oprendszerek, processzorok] = await Promise.all([
        Gep.find().select("gyarto ar db kijelzo processzorid oprendszerid").lean(),
        Oprendszer.find().lean(),
        Processzor.find().lean()
    ]);

    const osNev = Object.fromEntries(oprendszerek.map((o) => [o.id, o.nev]));
    const procGyarto = Object.fromEntries(processzorok.map((p) => [p.id, p.gyarto]));

    // Általános csoportosító: kulcs -> { db, arOssz, keszlet }
    const csoport = (kulcsFv) => {
        const m = new Map();
        gepek.forEach((g) => {
            const k = kulcsFv(g);
            const e = m.get(k) || { kulcs: k, db: 0, arOssz: 0, keszlet: 0 };
            e.db += 1;
            e.arOssz += g.ar;
            e.keszlet += g.db;
            m.set(k, e);
        });
        return [...m.values()];
    };

    
    const gyartoStat = csoport((g) => g.gyarto.toUpperCase()).sort((a, b) => b.db - a.db);
    const osStat = csoport((g) => osNev[g.oprendszerid] || "Ismeretlen").sort((a, b) => b.db - a.db);
    const procStat = csoport((g) => procGyarto[g.processzorid] || "Ismeretlen").sort((a, b) => b.db - a.db);
    const kijelzoStat = csoport((g) => g.kijelzo).sort((a, b) => a.kulcs - b.kulcs);

    const chartData = {
        gyarto: {
            labels: gyartoStat.map((g) => g.kulcs),
            db: gyartoStat.map((g) => g.db),
            atlagAr: gyartoStat.map((g) => Math.round(g.arOssz / g.db)),
            keszlet: gyartoStat.map((g) => g.keszlet)
        },
        oprendszer: {
            labels: osStat.map((o) => o.kulcs),
            db: osStat.map((o) => o.db)
        },
        procGyarto: {
            labels: procStat.map((p) => p.kulcs),
            db: procStat.map((p) => p.db)
        },
        kijelzo: {
            labels: kijelzoStat.map((k) => k.kulcs + '"'),
            db: kijelzoStat.map((k) => k.db),
            atlagAr: kijelzoStat.map((k) => Math.round(k.arOssz / k.db))
        }
    };

    res.render("diagram", {
        title: "Diagram",
        
        chartJson: JSON.stringify(chartData).replace(/</g, "\\u003c")
    });
};
