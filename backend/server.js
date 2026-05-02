const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const multer = require("multer");
const pdfParse = require("pdf-parse"); // STABLE VERSION 1.1.1


const authRoutes = require("./routes/auth");
const { requireAuth, requireIssuer } = require("./middleware/auth");
const { contract, disputeContract  } = require("./utils/blockchain");
const db = require("./utils/db");
const { uploadToIPFS } = require("./utils/ipfs");
const { getSigner } = require("./utils/blockchain");
const { getSignerByUserId } = require("./utils/blockchain");


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

const [result] = await db.query(
  `INSERT INTO certificates 
   (certificate_hash, issuer_id, blockchain_tx_hash) 
   VALUES (?, ?, ?)`,
  [hash, req.user.id, receipt.hash]
);

const certificateId = result.insertId;


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

    // =========================
    // 1. Extract content
    // =========================
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
    } 
    else {
      return res.status(400).json({
        error: "Provide certificateData or certificatePdf"
      });
    }

    // =========================
    // 2. Generate hash
    // =========================
    const normalized = normalizeText(content);
    const hash = hashCertificate(normalized);

    // =========================
    // 3. Verify on blockchain
    // =========================
    const [valid, issuer, timestamp] =
      await contract.verifyCertificate(hash);

    // =========================
    // 4. Fetch from DB (ID + STATUS)
    // =========================
    const [rows] = await db.query(
      "SELECT id, status FROM certificates WHERE certificate_hash = ? LIMIT 1",
      [hash.trim()]
    );

    console.log("DB ROWS:", rows);

    let certificateId = null;
    let status = "NOT_FOUND";

    if (rows.length > 0) {
      certificateId = rows[0].id;
      status = rows[0].status;
    }
let issuerReputation = null;

if (certificateId) {
  const [repRows] = await db.query(
    `SELECT u.issuer_reputation 
     FROM users u
     JOIN certificates c ON c.issuer_id = u.id
     WHERE c.id = ?`,
    [certificateId]
  );

  issuerReputation = repRows[0]?.issuer_reputation ?? 0;
}
console.log("Issuer Reputation:", issuerReputation);
    // =========================
    // 5. Response
    // =========================
    res.json({
      valid,
      issuer,
      timestamp: timestamp.toString(),
      hash,
      certificateId,
      issuerReputation,
      status, // 🔥 NEW FIELD
      source: req.file ? "pdf" : "text"
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);

    res.status(500).json({
      error: err.reason || err.message || "Verification failed"
    });
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




app.post("/raise-dispute", upload.single("evidence"), async (req, res) => {
  try {
    const { certificateId, reason } = req.body;

    if (!certificateId || !reason) {
      return res.status(400).json({
        error: "certificateId and reason are required"
      });
    }

    let ipfsHash = "";

    // =========================
    // 1. Upload evidence to IPFS
    // =========================
    if (req.file) {
      ipfsHash = await uploadToIPFS(
        req.file.buffer,
        req.file.originalname
      );
    }

    // =========================
    // 2. Raise dispute (TX 1)
    // =========================

    const signer = getSigner();
const contractWithSigner = disputeContract.connect(signer);


    const tx = await contractWithSigner.raiseDispute(
      Number(certificateId),
      reason
    );

    await tx.wait(); // ✅ wait fully mined

    await db.query(
  "UPDATE certificates SET status = 'DISPUTED' WHERE id = ?",
  [certificateId]
);

    // =========================
    // 3. Get disputeId
    // =========================
    const disputeIdBN = await disputeContract.disputeCount();
    const disputeId = Number(disputeIdBN);

    // =========================
    // 4. FIX NONCE ISSUE (IMPORTANT)
    // =========================
    await new Promise((resolve) => setTimeout(resolve, 500));

    // =========================
    // 5. Submit evidence (TX 2)
    // =========================
    if (ipfsHash) {
      const tx2 = await disputeContract.submitEvidence(
        disputeId,
        ipfsHash
      );

      await tx2.wait(); // ✅ wait again
    }

    // =========================
    // 6. Response
    // =========================
    res.json({
      success: true,
      message: "Dispute raised with evidence",
      disputeId,
      ipfsHash,
      txHash: tx.hash
    });

  } catch (err) {
    console.error("RAISE DISPUTE ERROR:", err);

    res.status(500).json({
      error: err.reason || err.message || "Failed to raise dispute"
    });
  }
});
app.get("/disputes", async (req, res) => {
  try {

    const disputes = [];

    const disputeCount = await disputeContract.disputeCount();

    for (let i = 1; i <= disputeCount; i++) {
      const d = await disputeContract.disputes(i);

     const [rows] = await db.query(
  "SELECT status FROM certificates WHERE id = ?",
  [Number(d[0])]
);

const certStatus = rows.length > 0 ? rows[0].status : "UNKNOWN";

disputes.push({
  id: i,
  certificateId: Number(d[0]),
  reason: d[2],
  evidenceHash: d[3],
  resolved: d[4],
  certificateValid: d[5],
  validVotes: Number(d[6]),     
  revokeVotes: Number(d[7]), 
  certStatus 
});
    }

    res.json(disputes);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

// app.post("/resolve-dispute", async (req, res) => {
//   try {
//     const { disputeId, certificateValid } = req.body;

//     const tx = await disputeContract.resolveDispute(
//       disputeId,
//       certificateValid
//     );

//     await tx.wait();

//     // 🔥 GET certificateId from blockchain
//     const d = await disputeContract.disputes(disputeId);
//     const certificateId = Number(d[0]);

//     // 🔥 UPDATE STATUS
//     const newStatus = certificateValid ? "VALID" : "REVOKED";

//     await db.query(
//       "UPDATE certificates SET status = ? WHERE id = ?",
//       [newStatus, certificateId]
//     );

//     res.json({
//       success: true,
//       message: "Dispute resolved",
//       status: newStatus
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Resolve failed" });
//   }
// });

app.post("/vote-dispute", async (req, res) => {
  try {
    const { disputeId, voteValid, userId } = req.body;

    if (!disputeId) {
      return res.status(400).json({ error: "disputeId required" });
    }

    // 🔥 map user → fixed signer
    const signer = getSignerByUserId(userId);

    const contractWithSigner = disputeContract.connect(signer);

    const tx = await contractWithSigner.vote(disputeId, voteValid);
    await tx.wait();

    // 🔥 Fetch updated dispute
    const d = await disputeContract.disputes(disputeId);

    const resolved = d[4];
    const certificateValid = d[5];
    const certificateId = Number(d[0]);

    // 🔥 If resolved → update DB
    if (resolved) {
  const status = certificateValid ? "VALID" : "REVOKED";

  // 🔹 Update certificate status
  await db.query(
    "UPDATE certificates SET status = ? WHERE id = ?",
    [status, certificateId]
  );

  // 🔥 GET ISSUER ID
  const [rows] = await db.query(
    "SELECT issuer_id FROM certificates WHERE id = ?",
    [certificateId]
  );

  const issuerId = rows[0]?.issuer_id;

  if (issuerId) {
    let change = 0;

    if (certificateValid) {
      change = 1;   // reward
    } else {
      change = -2;  // penalty
    }

    // 🔥 UPDATE REPUTATION
    await db.query(
      "UPDATE users SET issuer_reputation = issuer_reputation + ? WHERE id = ?",
      [change, issuerId]
    );
  }
}

    res.json({
      success: true,
      resolved,
      certificateValid
    });

  } catch (err) {
    console.error("VOTE ERROR:", err);

    res.status(500).json({
      error: err.reason || err.message || "Vote failed"
    });
  }
});
app.post("/test-ipfs", upload.single("file"), async (req, res) => {
  try {
    const cid = await uploadToIPFS(
      req.file.buffer,
      req.file.originalname
    );

    res.json({
      success: true,
      cid,
      url: `https://gateway.pinata.cloud/ipfs/${cid}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "IPFS test failed" });
  }
});
/**
 * Start server
 */
app.listen(5000, () => {
  console.log("Backend server running on port 5000");
});
