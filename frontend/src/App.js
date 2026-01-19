import IssueCertificate from "./pages/IssueCertificate";
import VerifyCertificate from "./pages/VerifyCertificate";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Blockchain Certificate Verification System</h1>

      <hr />
      <IssueCertificate />

      <hr />
      <VerifyCertificate />
    </div>
  );
}

export default App;
