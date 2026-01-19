import React, { useState } from "react";
import { issueCertificate } from "../api";

function IssueCertificate() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
      const res = await issueCertificate(formData);
      setResult("Issued successfully. Hash: " + res.data.hash);
    } catch (err) {
      setResult("Issue failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Issue Certificate</h2>

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
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Issuing..." : "Issue"}
      </button>

      <p>{result}</p>
    </div>
  );
}

export default IssueCertificate;
