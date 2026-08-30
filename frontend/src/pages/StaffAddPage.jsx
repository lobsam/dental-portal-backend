import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import { EndlessKnot } from "../components/TibetanMotif";
import { Section, Field, SelectField } from "./PatientAddPage";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  specialization: "",
  password: "",
  custom_role_id: "",
};

export default function StaffAddPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);

  useEffect(() => {
    api
      .get("/clinic/roles/")
      .then(setCustomRoles)
      .catch(() => setCustomRoles([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api
      .get(`/clinic/staff/${id}`)
      .then((s) => {
        setForm({
          first_name: s.first_name || "",
          last_name: s.last_name || "",
          email: s.email || "",
          phone: s.phone || "",
          specialization: s.specialization || "",
          password: "",
          custom_role_id: s.custom_role_id != null ? String(s.custom_role_id) : "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        const payload = {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || null,
          specialization: form.specialization || null,
          custom_role_id: form.custom_role_id ? Number(form.custom_role_id) : null,
        };
        await api.patch(`/clinic/staff/${id}`, payload);
        navigate("/settings/staff");
      } else {
        const payload = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || null,
          specialization: form.specialization || null,
          password: form.password,
          custom_role_id: form.custom_role_id ? Number(form.custom_role_id) : null,
        };
        await api.post("/clinic/staff/", payload);
        navigate("/settings/staff");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell title={isEdit ? "Edit Staff" : "Add Staff"}>
        <p className="text-sm text-maroon-400">Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={isEdit ? "Edit Staff" : "Add Staff"}
      actions={
        <Link to="/settings/staff" className="text-sm text-turquoise-600 hover:underline">
          ← Back to staff
        </Link>
      }
    >
      {error && (
        <div className="mb-4 text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Section title="Identity" icon={<EndlessKnot className="w-5 h-5 text-saffron-400" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required value={form.first_name} onChange={set("first_name")} />
            <Field label="Last name" required value={form.last_name} onChange={set("last_name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              className={isEdit ? "opacity-60 pointer-events-none" : ""}
              hint={isEdit ? "Email can't be changed here." : undefined}
              readOnly={isEdit}
            />
            <Field label="Phone" value={form.phone} onChange={set("phone")} />
          </div>
          {!isEdit && (
            <Field
              label="Temporary password"
              type="password"
              required
              value={form.password}
              onChange={set("password")}
              hint="The staff member can change this after logging in."
            />
          )}
        </Section>

        <Section title="Role">
          <Field
            label="Specialization"
            value={form.specialization}
            onChange={set("specialization")}
            placeholder="e.g. Orthodontics"
          />
          <SelectField
            label="Custom permission role"
            value={form.custom_role_id}
            onChange={set("custom_role_id")}
            options={[
              { value: "", label: "None — use default role permissions" },
              ...customRoles.map((r) => ({ value: String(r.id), label: r.name })),
            ]}
          />
          <p className="text-xs text-maroon-400">
            Manage available roles under{" "}
            <Link to="/settings/roles" className="text-turquoise-600 hover:underline">
              Settings → Role Manager
            </Link>
            .
          </p>
        </Section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg px-6 py-2.5"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add staff"}
          </button>
          <Link
            to="/settings/staff"
            className="border border-maroon-200 text-maroon-600 hover:border-maroon-400 rounded-lg px-6 py-2.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </PageShell>
  );
}
