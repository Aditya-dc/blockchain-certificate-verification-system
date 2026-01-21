import { useRef, useState } from "react";
import API from "../services/api";

export default function VerifyCertificate() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Verify Certificate
      </h2>

      {/* Custom file picker */}
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

      {/* PDF Preview */}
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

      {/* Verify button */}
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

      {/* Result */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-lg text-center font-bold ${
            result.valid
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {result.valid ? "✅ VALID CERTIFICATE" : "❌ INVALID CERTIFICATE"}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
