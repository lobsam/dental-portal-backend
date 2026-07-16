import { useAuth } from "../context/AuthContext";

export default function TopBar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 shrink-0 bg-parchment-50 border-b border-saffron-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-maroon-800">{title}</h1>

      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium text-maroon-800">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-turquoise-600 capitalize">{user.role}</p>
          </div>
        )}
        <div className="w-9 h-9 rounded-full bg-maroon-700 text-parchment-50 flex items-center justify-center text-sm font-semibold">
          {user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}` : "?"}
        </div>
        <button
          onClick={logout}
          className="text-sm text-maroon-500 hover:text-maroon-700 border border-maroon-200 hover:border-maroon-400 rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
