const jwt = require("jsonwebtoken");

exports.auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .json({ success: false, message: "You are not authenticated." });
    }

    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid token." });
    }

    await jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET_KEY,
      (err, decoded) => {
        if (err) {
          return res
            .status(400)
            .json({ success: false, message: "Token expired or invalid." });
        }
        req.user = {
          id: decoded.id,
          role: decoded.role,
        };
        next();
      }
    );
  } catch (error) {
    console.error("You are not authenticated.", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
  }
};
