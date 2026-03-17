const jwt = require("jsonwebtoken");

const authMiddleware = function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(403).json({
                message: "No authorization header provided!",
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(403).json({
                message: "unregistered user!",
            });
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            message: "unregistered user!",
        });
    }
};

const adminMiddleware = function (req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied' });
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware,
};