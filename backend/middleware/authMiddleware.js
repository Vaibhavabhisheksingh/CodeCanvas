// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const JWT_SECRET = process.env.JWT_SECRET;

// if (!JWT_SECRET) {
//   throw new Error("JWT_SECRET is missing from the backend .env file");
// }

// async function authenticateUser(req, res, next) {
//   try {
//     const authorization = req.headers.authorization;

//     if (!authorization || !authorization.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "Authentication required.",
//       });
//     }

//     const token = authorization.slice(7).trim();

//     if (!token) {
//       return res.status(401).json({
//         message: "Authentication token is missing.",
//       });
//     }

//     const decoded = jwt.verify(token, JWT_SECRET, {
//       issuer: "codecanvas",
//       audience: "codecanvas-users",
//     });

//     const user = await User.findById(decoded.userId).select("_id name email");

//     if (!user) {
//       return res.status(401).json({
//         message: "User account no longer exists.",
//       });
//     }

//     // Attach the authenticated user to the request.
//     req.user = user;

//     next();
//   } catch (error) {
//     if (
//       error.name === "JsonWebTokenError" ||
//       error.name === "TokenExpiredError" ||
//       error.name === "NotBeforeError"
//     ) {
//       return res.status(401).json({
//         message: "Invalid or expired authentication token.",
//       });
//     }

//     console.error("Authentication middleware error:", error.message);

//     return res.status(500).json({
//       message: "Authentication could not be completed.",
//     });
//   }
// }

// module.exports = authenticateUser;



const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from the backend .env file");
}

async function authenticateUser(req, res, next) {
  try {
    const token = req.cookies?.codecanvas_session;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "codecanvas",
      audience: "codecanvas-users",
    });

    const user = await User.findById(decoded.userId).select(
      "_id name email"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired authentication session.",
      });
    }

    console.error(
      "Authentication middleware error:",
      error.message
    );

    return res.status(500).json({
      message: "Authentication could not be completed.",
    });
  }
}

module.exports = authenticateUser;

