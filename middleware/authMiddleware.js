const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  if (req.method === "OPTIONS") {
    next();
  }

  try {
    // tekwirish authorization header is bor
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).json({
        message: "No authorization header provided!",
      });
    }

    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(403).json({
        message: "unregistered user!",
      });
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      message: "unregistered user!",
    });
  }
};
