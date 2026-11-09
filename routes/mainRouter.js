const router = require("express").Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const controller = require("../controllers/mainController");
const dataController = require("../controllers/dataController");
const contactController = require("../controllers/contactController");

// --- Látogató (mindenki) ---
router.get("/", controller.homeIndex);
router.get("/adatbazis", dataController.adatbazis);
router.get("/kapcsolat", contactController.form);
router.post("/kapcsolat", contactController.send);

// --- Autentikáció (az auth projektből) ---
router.get("/register", controller.registerGet);
router.post("/register", controller.registerPost);
router.get("/login", controller.loginGet);
router.post("/login", controller.loginPost);
router.get("/logout", controller.logout);

// --- Bejelentkezett felhasználó ---
router.get("/user", isLoggedIn, controller.userIndex);
router.get("/uzenetek", isLoggedIn, contactController.list);

// --- Admin ---
router.get("/admin", isAdmin, controller.adminIndex);

module.exports = router;
