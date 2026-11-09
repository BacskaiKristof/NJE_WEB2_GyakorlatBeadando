const router = require("express").Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const controller = require("../controllers/mainController");
const dataController = require("../controllers/dataController");
const contactController = require("../controllers/contactController");
const crudController = require("../controllers/crudController");

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
router.get("/diagram", isLoggedIn, dataController.diagram);

// --- Admin ---
router.get("/admin", isAdmin, controller.adminIndex);
router.get("/crud", isAdmin, crudController.index);
router.get("/crud/uj", isAdmin, crudController.newForm);
router.post("/crud/uj", isAdmin, crudController.create);
router.get("/crud/:id/szerkesztes", isAdmin, crudController.editForm);
router.post("/crud/:id/szerkesztes", isAdmin, crudController.update);
router.post("/crud/:id/torles", isAdmin, crudController.remove);

module.exports = router;
