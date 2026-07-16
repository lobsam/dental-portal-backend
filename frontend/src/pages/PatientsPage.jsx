import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import Modal from "../components/Modal";

const emptyForm = { first_name: "", last_name: "", email: "", phone: "", date_of_birth: "" };

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(q) {
    setLoading(true);
    try {
      const qs = q ? `?search=${encodeURIComponent(q)}` : "";
      const data = await api.get(`/clinic/patients/${qs}`);
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/clinic/patients/", {
        ...form,
        date_of_birth: form.date_of_birth || null,
      });
      setShowModal(false);
      setForm(emptyForm);
      load(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Patients"
      actions={
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients…"
            className="rounded-lg border border-maroon-200 px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-sm font-medium rounded-lg px-4 py-2"
          >
            + New Patient
          </button>
        </>
      }
    >
      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-parchment-100 text-maroon-600 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Date of birth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-saffron-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-maroon-400">
                  Loading…
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-maroon-400">
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="hover:bg-parchment-50">
                  <td className="px-5 py-3">
                    <Link
                      to={`/patients/${p.id}`}
                      className="text-maroon-800 font-medium hover:text-turquoise-600"
                    >
                      {p.first_name} {p.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-maroon-600">{p.phone || "—"}</td>
                  <td className="px-5 py-3 text-maroon-600">{p.email || "—"}</td>
                  <td className="px-5 py-3 text-maroon-600">{p.date_of_birth || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New patient">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="First name"
              required
              value={form.first_name}
              onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
            />
            <TextField
              label="Last name"
              required
              value={form.last_name}
              onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
          </div>
          <TextField
            label="Date of birth"
            type="date"
            value={form.date_of_birth}
            onChange={(v) => setForm((f) => ({ ...f, date_of_birth: v }))}
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5"
          >
            {saving ? "Saving…" : "Create patient"}
          </button>
        </form>
      </Modal>
    </PageShell>
  );
}

export function TextField({ label, value, onChange, type = "text", required, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-maroon-700 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
      />
    </div>
  );
}
