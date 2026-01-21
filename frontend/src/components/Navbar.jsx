import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur border-b px-8 py-4 flex justify-between">
      <h1 className="font-extrabold text-xl text-indigo-600">
        CertiChain
      </h1>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {user.name} ({user.role})
          </span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
