import Navbar from "./components/Navbar";
import IssuerDashboard from "./pages/IssuerDashboard";
import VerifyCertificate from "./pages/VerifyCertificate";
import DisputeDashboard from "./pages/DisputeDashboard";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  // Not logged in → Auth page (login/signup toggle)
  if (!user) {
    return <AuthPage />;
  }

  // Logged in → Dashboard
  return (
    <>
      <Navbar />
      {user.role === "issuer" ? (
        <IssuerDashboard />
      ) : (
         <>
    <VerifyCertificate />
    <DisputeDashboard />
  </>
      )}
    </>
  );
}

export default App;
