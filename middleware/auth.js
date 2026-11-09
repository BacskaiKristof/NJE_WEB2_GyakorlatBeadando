// Jogosultság-ellenőrző middleware-ek (az auth projekt mainRouter.js-éből kiemelve).

// Csak bejelentkezett felhasználó; különben /login
const isLoggedIn = (req, res, next) => {
    if (req.session.user) { return next(); }
    res.redirect("/login");
};

// Csak admin; különben / (főoldal)
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === "admin") { return next(); }
    res.redirect("/");
};

module.exports = { isLoggedIn, isAdmin };
