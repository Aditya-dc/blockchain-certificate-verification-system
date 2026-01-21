const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const multer = require("multer");
const pdfParse = require("pdf-parse"); // STABLE VERSION 1.1.1


const authRoutes = require("./routes/auth");
const { requireAuth, requireIssuer } = require("./middleware/auth");
const { contract } = require("./utils/blockchain");
const db = require("./utils/db");

// Multer: store file in memory
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);


// (async () => {
//   try {
//     const [rows] = await db.query("SELECT 1");
//     console.log("✅ MySQL connected");
//   } catch (err) {
//     console.error("❌ MySQL connection failed", err);
//   }
// })();
/**
 * Hash certificate content using SHA-256
 */
function hashCertificate(data) {
  return "0x" + crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Normalize extracted text
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * =========================
 * ISSUE CERTIFICATE
 * =========================
 */
app.post("/issue",requireAuth,requireIssuer, upload.single("certificatePdf"), async (req, res) => {
  try {
    let content = "";

  if (req.file) {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        content = pdfData.text;
      } catch (pdfErr) {
        return res.status(400).json({
          error: "Invalid or unsupported PDF file"
        });
      }
    } 
 else if (req.body.certificateData) {
      content = req.body.certificateData;
    } else {
      return res.status(400).json({
        error: "Provide certificateData or certificatePdf"
      });
    }

    const normalized = normalizeText(content);
    const hash = hashCertificate(normalized);
    // Check if certificate already issued
    const db = require("./utils/db");
const [existing] = await db.query(
  "SELECT id FROM certificates WHERE certificate_hash = ?",
  [hash]
);

if (existing.length > 0) {
  return res.status(400).json({
    error: "Certificate already issued"
  });
}


    const tx = await contract.issueCertificate(hash);
const receipt = await tx.wait();

// Save metadata in DB

await db.query(
  `INSERT INTO certificates 
   (certificate_hash, issuer_id, blockchain_tx_hash) 
   VALUES (?, ?, ?)`,
  [
    hash,
    req.user.id,           // issuer from JWT
    receipt.hash
  ]
);


    res.json({
      message: "Certificate issued successfully",
      hash,
      txHash: receipt.hash,
      source: req.file ? "pdf" : "text"
    });
  } catch (err) {
    console.error("ISSUE ERROR:", err);
    res.status(500).json({ error: "Issue failed" });
  }
});

/**
 * =========================
 * VERIFY CERTIFICATE
 * =========================
 */
app.post("/verify", upload.single("certificatePdf"), async (req, res) => {
  try {
    let content = "";

    if (req.file) {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        content = pdfData.text;
      } catch (pdfErr) {
        return res.status(400).json({
          error: "Invalid or unsupported PDF file"
        });
      }
    } 
    else if (req.body.certificateData) {
      content = req.body.certificateData;
    } else {
      return res.status(400).json({
        error: "Provide certificateData or certificatePdf"
      });
    }

    const normalized = normalizeText(content);
    const hash = hashCertificate(normalized);

    const [valid, issuer, timestamp] =
      await contract.verifyCertificate(hash);

    res.json({
      valid,
      issuer,
      timestamp: timestamp.toString(),
      hash,
      source: req.file ? "pdf" : "text"
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("Backend connected to blockchain");
});


/**
 * Issuer Certificates
 */
app.get(
  "/issuer/certificates",
  requireAuth,
  requireIssuer,
  async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT id, certificate_hash, issued_at, blockchain_tx_hash
         FROM certificates
         WHERE issuer_id = ?`,
        [req.user.id]
      );

      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  }
);
/**
 * Start server
 */
app.listen(5000, () => {
  console.log("Backend server running on port 5000");
});
