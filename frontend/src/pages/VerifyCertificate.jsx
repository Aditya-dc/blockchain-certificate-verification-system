import { useRef, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function VerifyCertificate() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState(null); // 🔥 NEW

  // =========================
  // VERIFY
  // =========================
  const verify = async () => {
    if (!file) {
      setError("Please select a certificate PDF to verify.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.append("certificatePdf", file);

      const res = await API.post("/verify", form);
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Verification failed. Invalid or unsupported certificate."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RAISE DISPUTE (IPFS)
  // =========================
  const raiseDispute = async () => {
    try {
      if (!reason) {
        alert("Reason is required");
        return;
      }

      const formData = new FormData();
      formData.append("certificateId", result?.certificateId);
      formData.append("reason", reason);

      if (evidence) {
        formData.append("evidence", evidence); // 🔥 FILE SENT
      }

      const res = await API.post("/raise-dispute", formData);

      alert(
  res.data.ipfsHash
    ? `Dispute raised!\n\nView Evidence:\nhttps://gateway.pinata.cloud/ipfs/${res.data.ipfsHash}`
    : "Dispute raised (no evidence uploaded)"
);

      setShowModal(false);
      setReason("");
      setEvidence(null);

    } catch (err) {
      console.error(err);
      alert("Failed to raise dispute");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Verify Certificate
      </h2>

      {/* FILE PICKER */}
      <div className="mb-4">
        <label
          htmlFor="verifyPdf"
          className="block w-full cursor-pointer px-4 py-3 border-2 border-dashed rounded-xl text-center text-gray-600 hover:border-green-500 hover:text-green-600 transition"
        >
          {file ? file.name : "Click to select certificate PDF"}
        </label>

        <input
          ref={fileInputRef}
          id="verifyPdf"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files[0];
            if (!selectedFile) return;

            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }

            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResult(null);
            setError("");
          }}
        />
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">

            <h3 className="text-lg font-bold mb-4">
              Raise Dispute
            </h3>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter dispute reason..."
              className="w-full border rounded-lg p-2 mb-4"
              rows={4}
            />

            {/* 🔥 NEW: FILE INPUT */}
            <input
              type="file"
              onChange={(e) => setEvidence(e.target.files[0])}
              className="mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>

              <button
                onClick={raiseDispute}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Submit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PDF PREVIEW */}
      {previewUrl && (
        <div className="mt-6 rounded-2xl border bg-gray-50 shadow-inner">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-white rounded-t-2xl">
            <span className="text-sm font-semibold text-gray-700">
              Certificate Preview
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {file?.name}
            </span>
          </div>

          <div className="overflow-hidden rounded-b-2xl">
            <iframe
              src={previewUrl}
              title="Certificate Preview"
              className="w-full h-80 bg-white"
            />
          </div>
        </div>
      )}

      {/* VERIFY BUTTON */}
      <button
        onClick={verify}
        disabled={loading}
        className={`w-full mt-6 py-3 rounded-xl font-semibold text-white transition
          ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-[1.02]"
          }`}
      >
        {loading ? "Verifying..." : "Verify Certificate"}
      </button>

      {/* RESULT */}
      {result && (
  <div className="mt-6 text-center">

    {/* VALID / INVALID */}
    <div
      className={`p-4 rounded-lg font-bold ${
        result.valid
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {result.valid
        ? "✅ VALID CERTIFICATE"
        : "❌ INVALID CERTIFICATE"}
    </div>

    {/* STATUS */}
    <div
      className={`mt-3 font-bold ${
        result.status === "VALID"
          ? "text-green-600"
          : result.status === "DISPUTED"
          ? "text-yellow-600"
          : result.status === "REVOKED"
          ? "text-red-600"
          : "text-gray-500"
      }`}
    >
      Status: {result.status}
    </div>

    {/* 🔥 ADD REPUTATION HERE */}
    {result.issuerReputation !== null && (
      <div className="mt-2 text-sm font-medium">
        Issuer Reputation:{" "}
        <span
          className={`${
            result.issuerReputation >= 3
              ? "text-green-600"
              : result.issuerReputation >= 0
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {result.issuerReputation}
        </span>
      </div>
    )}

    {/* 🔥 OPTIONAL TRUST BADGE */}
    {result.issuerReputation !== null && (
      <div className="mt-2 text-sm font-medium">
  {result.issuerReputation >= 3 && (
    <span className="text-green-600">🟢 High Trust</span>
  )}

  {result.issuerReputation >= -1 && result.issuerReputation < 3 && (
    <span className="text-yellow-600">🟡 Neutral Trust</span>
  )}

  {result.issuerReputation < -1 && (
    <span className="text-red-600">🔴 Low Trust</span>
  )}
</div>
    )}

    {/* 🔥 OPTIONAL WARNING */}
    {result.issuerReputation < 0 && (
      <div className="mt-2 text-red-600 text-sm">
        ⚠️ This issuer has low credibility. Verify carefully.
      </div>
    )}

    {/* DISPUTE BUTTON */}
    {result?.valid &&
      result?.certificateId &&
      user.role === "verifier" && (
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Raise Dispute
        </button>
      )}
  </div>
)}
      {/* ERROR */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}