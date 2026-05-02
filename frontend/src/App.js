import Navbar from "./components/Navbar";
import IssuerDashboard from "./pages/IssuerDashboard";
import VerifyCertificate from "./pages/VerifyCertificate";
import DisputeDashboard from "./pages/DisputeDashboard";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  // Not logged in → Auth page
  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Navbar />

      {user.role === "issuer" && <IssuerDashboard />}

      {user.role === "verifier" && <VerifyCertificate />}

      {user.role === "arbitrator" && <DisputeDashboard />}
    </>
  );
}

export default App;