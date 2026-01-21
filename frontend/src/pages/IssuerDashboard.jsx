import { useRef, useState } from "react";
import API from "../services/api";

export default function IssuerDashboard() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const clearMessages = () => {
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 5000); // auto clear after 5 sec
  };

  const issueCertificate = async () => {
    if (!file) {
      setError("Please select a certificate PDF first.");
      clearMessages();
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("certificatePdf", file);

      const res = await API.post("/issue", formData);

      if (!res.data.txHash) {
        throw new Error("Transaction hash missing");
      }

      setSuccess(
        `Certificate issued successfully!\n\nTransaction Hash:\n${res.data.txHash}`
      );

      // Reset file input
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      clearMessages();
    } catch (err) {
      if (
        err.response?.data?.error &&
        err.response.data.error.toLowerCase().includes("issued")
      ) {
        setError("This certificate has already been issued.");
      } else {
        setError("Failed to issue certificate. Please try again.");
      }
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Issue Certificate
      </h2>

      {/* Custom file picker */}
      <div className="mb-4">
        <label
          htmlFor="pdfUpload"
          className="block w-full cursor-pointer px-4 py-3 border-2 border-dashed rounded-xl text-center text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition"
        >
          {file ? file.name : "Click to select certificate PDF"}
        </label>

        <input
          ref={fileInputRef}
          id="pdfUpload"
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
}}


        />
      </div>
      {previewUrl && (
  <div className="mt-6 rounded-2xl border bg-gray-50 shadow-inner">
    
    {/* Preview header */}
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white rounded-t-2xl">
      <span className="text-sm font-semibold text-gray-700">
        Certificate Preview
      </span>
      <span className="text-xs text-gray-500 truncate max-w-[200px]">
        {file?.name}
      </span>
    </div>

    {/* PDF iframe */}
    <div className="overflow-hidden rounded-b-2xl">
      <iframe
        src={previewUrl}
        title="Certificate Preview"
        className="w-full h-80 bg-white"
      />
    </div>

  </div>
)}



      {/* Issue button */}
      <button
        onClick={issueCertificate}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-semibold text-white transition
          ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02]"
          }`}
      >
        {loading ? "Issuing..." : "Issue Certificate"}
      </button>

      {/* Success */}
      {success && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-sm whitespace-pre-wrap">
          {success}
          
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
