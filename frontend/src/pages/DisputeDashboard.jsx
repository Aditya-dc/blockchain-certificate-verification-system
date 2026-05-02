import { useEffect, useState } from "react";
import API from "../services/api";

export default function DisputeDashboard() {

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedDisputes, setVotedDisputes] = useState({});
  const [userId, setUserId] = useState("0");


  const fetchDisputes = async () => {
    try {
      const res = await API.get("/disputes");
      setDisputes(res.data);
    } catch (err) {
      console.error("Failed to fetch disputes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  // =========================
  // RESOLVE DISPUTE
  // =========================
 const voteDispute = async (id, voteValid) => {
  try {
    await API.post("/vote-dispute", {
      disputeId: id,
      voteValid,
       userId // simulate user
    });

    setVotedDisputes(prev => ({ ...prev, [id]: true }));

    fetchDisputes();
  } catch (err) {
    alert("Vote failed");
  }
};
  return (
    
    <div className="max-w-5xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Dispute Dashboard
      </h2>
<div className="mb-4">
      <label className="mr-2 font-semibold">Select Arbiter:</label>

      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="0">Arbiter 1</option>
        <option value="1">Arbiter 2</option>
        <option value="2">Arbiter 3</option>
      </select>
    </div>
      {loading ? (
        <p>Loading disputes...</p>
      ) : disputes.length === 0 ? (
        <p>No disputes found.</p>
      ) : (

        <table className="w-full border rounded-lg overflow-hidden">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Dispute ID</th>
              <th className="p-3 text-left">Certificate ID</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Evidence</th> {/* 🔥 NEW */}
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Votes</th>
              <th className="p-3 text-left">Resolve</th>
            </tr>
          </thead>

          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} className="border-t">

                <td className="p-3">{d.id}</td>

                <td className="p-3">{d.certificateId}</td>

                <td className="p-3">{d.reason}</td>

                {/* 🔥 EVIDENCE COLUMN */}
                <td className="p-3">
                  {d.evidenceHash ? (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${d.evidenceHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* STATUS */}
                <td className="p-3">
                  <span
                    className={`font-semibold ${
                      d.certStatus === "VALID"
                        ? "text-green-600"
                        : d.certStatus === "DISPUTED"
                        ? "text-yellow-600"
                        : d.certStatus === "REVOKED"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {d.certStatus}
                  </span>
                </td>

                {/* VOTES */}
                <td className="p-3">
  <span className="text-green-600 font-semibold">
    {d.validVotes}
  </span>
  {" / "}
  <span className="text-red-600 font-semibold">
    {d.revokeVotes}
  </span>
</td>

                {/* ACTIONS */}
            <td className="p-3">
  {!d.resolved ? (
    votedDisputes[d.id] ? (
      <span className="text-gray-500 text-sm">
        Already voted
      </span>
    ) : (
      <div className="flex gap-2">
        <button
          onClick={() => voteDispute(d.id, true)}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
        >
          Vote VALID
        </button>

        <button
          onClick={() => voteDispute(d.id, false)}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
        >
          Vote REVOKE
        </button>
      </div>
    )
  ) : (
    <span
      className={`font-semibold ${
        d.certificateValid
          ? "text-green-600"
          : "text-red-600"
      }`}
    >
      {d.certificateValid ? "VALID" : "REVOKED"}
    </span>
  )}
</td>
                
              </tr>
            ))}
          </tbody>

        </table>

      )}

    </div>
  );
}