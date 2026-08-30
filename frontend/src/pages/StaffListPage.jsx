import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  dentist: "Dentist",
  staff: "Staff",
};

export default function StaffListPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/clinic/staff/");
      setStaff(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deactivate(member) {
    if (!window.confirm(`Deactivate ${member.first_name} ${member.last_name}?`)) return;
    try {
      await api.delete(`/clinic/staff/${member.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reactivate(member) {
    try {
      await api.patch(`/clinic/staff/${member.id}`, { is_active: true });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = staff.filter((s) => showInactive || s.is_active);

  return (
    <PageShell
      title="Staff"
      actions={
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-maroon-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-maroon-300 text-maroon-700 focus:ring-turquoise-400"
            />
            Show inactive
          </label>
          <Link
            to="/settings/staff/add"
            className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-sm font-medium rounded-lg px-4 py-2"
          >
            + Add Staff
          </Link>
        </div>
      }
    >
      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-parchment-100 text-maroon-600 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-saffron-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-maroon-400">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-maroon-400">
                  No staff found.
                </td>
              </tr>
            ) : (
              visible.map((s) => (
                <tr key={s.id} className={`hover:bg-parchment-50 ${!s.is_active ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3">
                    <Link
                      to={`/settings/staff/${s.id}/edit`}
                      className="text-maroon-800 font-medium hover:text-turquoise-600"
                    >
                      {s.first_name} {s.last_name}
                    </Link>
                    {!s.is_active && <span className="ml-2 text-xs text-maroon-400">(inactive)</span>}
                  </td>
                  <td className="px-5 py-3 text-maroon-600">{ROLE_LABELS[s.role] || s.role}</td>
                  <td className="px-5 py-3 text-maroon-600">{s.email}</td>
                  <td className="px-5 py-3 text-maroon-600">{s.phone || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    {s.is_active ? (
                      <button
                        onClick={() => deactivate(s)}
                        className="text-xs border border-maroon-200 hover:border-maroon-400 text-maroon-600 rounded-lg px-3 py-1.5"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivate(s)}
                        className="text-xs bg-turquoise-500 hover:bg-turquoise-600 text-white rounded-lg px-3 py-1.5"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
