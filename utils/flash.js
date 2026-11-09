// Session flash üzenet: a következő kérésnél egyszer jelenik meg, utána törlődik.
// type: Bootstrap alert típus (success, danger, warning, info)
module.exports = (req, text, type = "danger") => {
    req.session.message = text;
    req.session.messageType = type;
};
