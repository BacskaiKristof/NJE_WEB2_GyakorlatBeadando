const router = require("express").Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const controller = require("../controllers/mainController");

// --- Látogató (mindenki) ---
router.get("/", controller.homeIndex);

// --- Autentikáció (az auth projektből) ---
router.get("/register", controller.registerGet);
router.post("/register", controller.registerPost);
router.get("/login", controller.loginGet);
router.post("/login", controller.loginPost);
router.get("/logout", controller.logout);

// --- Bejelentkezett felhasználó ---
router.get("/user", isLoggedIn, controller.userIndex);

// --- Admin ---
router.get("/admin", isAdmin, controller.adminIndex);

module.exports = router;
