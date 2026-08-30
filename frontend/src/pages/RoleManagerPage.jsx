import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";

export default function RoleManagerPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/clinic/roles/");
      setRoles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(role) {
    if (!window.confirm(`Delete role "${role.name}"? Staff assigned to it will lose these permissions.`)) return;
    try {
      await api.delete(`/clinic/roles/${role.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageShell
      title="Role Manager"
      actions={
        <Link
          to="/settings/roles/add"
          className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-sm font-medium rounded-lg px-4 py-2"
        >
          + Add Role
        </Link>
      }
    >
      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-maroon-400 text-center">Loading…</p>
        ) : roles.length === 0 ? (
          <p className="p-6 text-sm text-maroon-400 text-center">
            No custom roles yet. Add one to set fine-grained menu permissions for staff.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-parchment-100 text-maroon-600 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Role Name</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Permissions set</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-100">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-parchment-50">
                  <td className="px-5 py-3">
                    <Link
                      to={`/settings/roles/${r.id}/edit`}
                      className="text-maroon-800 font-medium hover:text-turquoise-600"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-maroon-600">{r.description || "—"}</td>
                  <td className="px-5 py-3 text-maroon-600">
                    {Object.keys(r.permissions || {}).length} menu item
                    {Object.keys(r.permissions || {}).length === 1 ? "" : "s"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(r)}
                      className="text-xs border border-maroon-200 hover:border-maroon-400 text-maroon-600 rounded-lg px-3 py-1.5"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
