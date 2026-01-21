import { useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("issuer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password, role };

      const res = await API.post(endpoint, payload);

      // auto-login for both login & signup
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setMode("login")}
            className={`w-1/2 py-2 font-semibold ${
              mode === "login"
                ? "bg-indigo-600 text-white"
                : "text-gray-600"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`w-1/2 py-2 font-semibold ${
              mode === "signup"
                ? "bg-indigo-600 text-white"
                : "text-gray-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="issuer">Issuer</option>
                <option value="student">Student</option>
              </select>
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold ${
              loading
                ? "bg-gray-400"
                : "bg-gradient-to-r from-indigo-600 to-purple-600"
            }`}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Sign Up"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-600 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
