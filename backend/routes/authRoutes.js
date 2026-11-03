// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const router = express.Router();

// const JWT_SECRET = process.env.JWT_SECRET;

// if (!JWT_SECRET) {
//   throw new Error("JWT_SECRET is missing from the backend .env file");
// }

// function createToken(user) {
//   return jwt.sign(
//     {
//       userId: user._id.toString(),
//     },
//     JWT_SECRET,
//     {
//       expiresIn: "1d",
//       issuer: "codecanvas",
//       audience: "codecanvas-users",
//     },
//   );
// }

// // POST /api/auth/register
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (
//       typeof name !== "string" ||
//       typeof email !== "string" ||
//       typeof password !== "string"
//     ) {
//       return res.status(400).json({
//         message: "Name, email, and password are required.",
//       });
//     }

//     const cleanName = name.trim();
//     const cleanEmail = email.trim().toLowerCase();

//     if (cleanName.length < 2 || cleanName.length > 80) {
//       return res.status(400).json({
//         message: "Name must contain between 2 and 80 characters.",
//       });
//     }

//     if (
//       cleanEmail.length > 254 ||
//       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
//     ) {
//       return res.status(400).json({
//         message: "Please provide a valid email address.",
//       });
//     }

//     // bcrypt processes at most 72 bytes of a password.
//     if (password.length < 6 ) { //|| Buffer.byteLength(password, "utf8") > 72
//       return res.status(400).json({
//         message:
//           "Password must be at least 6 characters.",
//       });
//     }

//     const existingUser = await User.findOne({
//       email: cleanEmail,
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         message: "An account with this email already exists.",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 6);

//     const user = await User.create({
//       name: cleanName,
//       email: cleanEmail,
//       password: hashedPassword,
//     });

//     const token = createToken(user);

//     return res.status(201).json({
//       message: "Account created successfully.",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(409).json({
//         message: "An account with this email already exists.",
//       });
//     }

//     console.error("Registration error:", error.message);

//     return res.status(500).json({
//       message: "Unable to create account.",
//     });
//   }
// });

// // POST /api/auth/login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (typeof email !== "string" || typeof password !== "string") {
//       return res.status(400).json({
//         message: "Email and password are required.",
//       });
//     }

//     const cleanEmail = email.trim().toLowerCase();

//     const user = await User.findOne({
//       email: cleanEmail,
//     }).select("+password");

//     if (!user) {
//       return res.status(401).json({
//         message: "Invalid email or password.",
//       });
//     }

//     const passwordMatches = await bcrypt.compare(password, user.password);

//     if (!passwordMatches) {
//       return res.status(401).json({
//         message: "Invalid email or password.",
//       });
//     }

//     const token = createToken(user);

//     return res.status(200).json({
//       message: "Login successful.",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error.message);

//     return res.status(500).json({
//       message: "Unable to log in.",
//     });
//   }
// });

// // GET /api/auth/me
// router.get("/me", async (req, res) => {
//   try {
//     const authorization = req.headers.authorization;

//     if (!authorization || !authorization.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "Authentication required.",
//       });
//     }

//     const token = authorization.slice(7).trim();

//     const decoded = jwt.verify(token, JWT_SECRET, {
//       issuer: "codecanvas",
//       audience: "codecanvas-users",
//     });

//     const user = await User.findById(decoded.userId);

//     if (!user) {
//       return res.status(401).json({
//         message: "User account not found.",
//       });
//     }

//     return res.status(200).json({
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     return res.status(401).json({
//       message: "Invalid or expired authentication token.",
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from the backend .env file");
}

const COOKIE_NAME = "codecanvas_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
      issuer: "codecanvas",
      audience: "codecanvas-users",
    }
  );
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

function getAuthenticatedUserId(req) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: "codecanvas",
    audience: "codecanvas-users",
  });

  return decoded.userId;
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        message: "Name must contain between 2 and 80 characters.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (
       password.length < 6 //||
      // Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 6);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = createToken(user);

    setSessionCookie(res, token);

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to create account.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user);

    setSessionCookie(res, token);

    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

// CURRENT USER
router.get("/me", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const user = await User.findById(userId).select(
      "_id name email"
    );

    if (!user) {
      clearSessionCookie(res);

      return res.status(401).json({
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    clearSessionCookie(res);

    return res.status(401).json({
      message: "Invalid or expired authentication session.",
    });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  clearSessionCookie(res);

  return res.json({
    message: "Logged out successfully.",
  });
});

module.exports = router;

