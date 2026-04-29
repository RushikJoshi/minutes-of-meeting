const express = require("express");
const { z } = require("zod");
const { register, login, me } = require("../controllers/authController");
const { validateBody } = require("../middlewares/validateMiddleware");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/auth/register",
  validateBody(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
    })
  ),
  register
);

router.post(
  "/auth/login",
  validateBody(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  ),
  login
);

router.get("/auth/me", requireAuth, me);

// Verhoeff Algorithm matrices for Aadhar Validation
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function validateAadhar(aadharNumber) {
  if (aadharNumber.length !== 12 || isNaN(aadharNumber)) return false;
  let c = 0;
  let invertedArray = aadharNumber.split('').map(Number).reverse();
  for (let i = 0; i < invertedArray.length; i++) {
    c = d[c][p[i % 8][invertedArray[i]]];
  }
  return c === 0;
}

// Verify Documents Mock
router.post("/verify-documents", (req, res) => {
  const { documentType, documentNumber, mobile } = req.body;

  if (!documentNumber) {
    return res.status(400).json({ success: false, message: "Verification Failed: Document number is required." });
  }

  if (documentType === "AADHAR") {
    // 1. Length & Number Check
    // 2. Mathematically Check via Verhoeff Algorithm
    if (!validateAadhar(documentNumber)) {
      return res.status(400).json({ success: false, message: "Verification Failed: Fake or Invalid Aadhar Number" });
    }
    
    // NOTE: If you have a real third-party API (like Cashfree, Setu, Sandbox API), you would make the axios call here.
    
  } else if (documentType === "PAN") {
    if (documentNumber.length < 10) {
      return res.status(400).json({ success: false, message: "Verification Failed: Invalid PAN Card Number" });
    }
  } else if (documentType === "DL") {
    if (documentNumber.length < 5) {
      return res.status(400).json({ success: false, message: "Verification Failed: Invalid Driving License" });
    }
  } else {
    return res.status(400).json({ success: false, message: "Verification Failed: Invalid Document Type" });
  }

  res.json({ success: true, message: `${documentType} Verified Successfully`, status: "verified" });
});

module.exports = router;


