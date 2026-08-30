import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import { Section, Field } from "./PatientAddPage";

const LEVELS = [
  { value: "none", label: "No access" },
  { value: "view", label: "View Only" },
  { value: "write", label: "Read/Write" },
];

export default function RoleFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const menu = await api.get("/clinic/roles/menu-items");
        setGroups(menu);
        if (isEdit) {
          const role = await api.get(`/clinic/roles/${id}`);
          setName(role.name);
          setDescription(role.description || "");
          setPermissions(role.permissions || {});
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  function setLevel(key, level) {
    setPermissions((prev) => ({ ...prev, [key]: level }));
  }

  function levelFor(key) {
    return permissions[key] || "none";
  }

  function setWholeGroup(items, level) {
    setPermissions((prev) => {
      const next = { ...prev };
      items.forEach(({ key }) => {
        next[key] = level;
      });
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { name, description: description || null, permissions };
      if (isEdit) {
        await api.patch(`/clinic/roles/${id}`, payload);
      } else {
        await api.post("/clinic/roles/", payload);
      }
      navigate("/settings/roles");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell title={isEdit ? "Edit Role" : "Add Role"}>
        <p className="text-sm text-maroon-400">Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={isEdit ? "Edit Role" : "Add Role"}
      actions={
        <Link to="/settings/roles" className="text-sm text-turquoise-600 hover:underline">
          ← Back to roles
        </Link>
      }
    >
      {error && (
        <div className="mb-4 text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <Section title="Role details">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Role Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front Desk"
            />
            <Field
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </Section>

        <div className="bg-white rounded-2xl border border-saffron-200 p-6">
          <h2 className="text-maroon-800 font-semibold mb-1">Menu Permissions</h2>
          <p className="text-xs text-maroon-400 mb-4">
            Choose Read/Write, View Only, or No access for each menu item.
          </p>

          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.group}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-maroon-700">{group.group}</h3>
                  <div className="flex gap-2">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setWholeGroup(group.items, lvl.value)}
                        className="text-[11px] text-turquoise-600 hover:underline"
                      >
                        All {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-maroon-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-maroon-50">
                      {group.items.map((item) => (
                        <tr key={item.key} className="hover:bg-parchment-50">
                          <td className="px-4 py-2 text-maroon-700 w-1/2">{item.label}</td>
                          <td className="px-4 py-2">
                            <div className="flex gap-4">
                              {LEVELS.map((lvl) => (
                                <label
                                  key={lvl.value}
                                  className="flex items-center gap-1.5 text-xs text-maroon-600 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`perm-${item.key}`}
                                    checked={levelFor(item.key) === lvl.value}
                                    onChange={() => setLevel(item.key, lvl.value)}
                                    className="text-maroon-700 focus:ring-turquoise-400"
                                  />
                                  {lvl.label}
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg px-6 py-2.5"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add role"}
          </button>
          <Link
            to="/settings/roles"
            className="border border-maroon-200 text-maroon-600 hover:border-maroon-400 rounded-lg px-6 py-2.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </PageShell>
  );
}
