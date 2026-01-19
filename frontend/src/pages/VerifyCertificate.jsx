import React, { useState } from "react";
import { verifyCertificate } from "../api";

function VerifyCertificate() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const formData = new FormData();

    if (file) {
      formData.append("certificatePdf", file);
    } else if (text) {
      formData.append("certificateData", text);
    } else {
      alert("Upload PDF or enter certificate text");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyCertificate(formData);
      setResult(res.data);
    } catch (err) {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Verify Certificate</h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <p>OR</p>

      <textarea
        placeholder="Enter certificate text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? "Verifying..." : "Verify"}
      </button>

      {result && (
        <div>
          <p>Status: {result.valid ? "VALID ✅" : "INVALID ❌"}</p>
          {result.valid && (
            <>
              <p>Issuer: {result.issuer}</p>
              <p>Timestamp: {result.timestamp}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default VerifyCertificate;
