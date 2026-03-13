import { useEffect, useState } from "react";
import API from "../services/api";

export default function DisputeDashboard() {

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Resolve dispute
  const resolveDispute = async (id, verdict) => {
    try {

      await API.post("/resolve-dispute", {
        disputeId: id,
        certificateValid: verdict
      });

      alert("Dispute resolved");

      fetchDisputes();

    } catch (err) {
      console.error(err);
      alert("Failed to resolve dispute");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Dispute Dashboard
      </h2>

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
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Resolve</th>
            </tr>
          </thead>

          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} className="border-t">

                <td className="p-3">{d.id}</td>

                <td className="p-3">{d.certificateId}</td>

                <td className="p-3">{d.reason}</td>

                <td className="p-3">
                  {d.resolved ? (
                    <span className="text-green-600 font-semibold">
                      RESOLVED
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      OPEN
                    </span>
                  )}
                </td>

                <td className="p-3">

                  {!d.resolved && (
                    <>
                      <button
                        onClick={() => resolveDispute(d.id, true)}
                        className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700"
                      >
                        VALID
                      </button>

                      <button
                        onClick={() => resolveDispute(d.id, false)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        REVOKE
                      </button>
                    </>
                  )}

                  {d.resolved && (
                    <span className="text-gray-500">Closed</span>
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