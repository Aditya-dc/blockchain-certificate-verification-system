const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const multer = require("multer");
const pdfParse = require("pdf-parse"); // STABLE VERSION 1.1.1

const { contract } = require("./utils/blockchain");

// Multer: store file in memory
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

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
app.post("/issue", upload.single("certificatePdf"), async (req, res) => {
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

    const tx = await contract.issueCertificate(hash);
    await tx.wait();

    res.json({
      message: "Certificate issued successfully",
      hash,
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
 * Start server
 */
app.listen(5000, () => {
  console.log("Backend server running on port 5000");
});
