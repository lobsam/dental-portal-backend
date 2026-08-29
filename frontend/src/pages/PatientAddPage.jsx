import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import { EndlessKnot } from "../components/TibetanMotif";

const emptyForm = {
  patient_code: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  nickname: "",
  gender: "",
  email: "",
  phone: "",
  date_of_birth: "",
  address: "",
  job_title: "",
  height: "",
  weight: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  recall_date: "",
  has_allergies: false,
  allergies: "",
  patient_source_id: "",
  notes: "",
};

export default function PatientAddPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [sources, setSources] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/clinic/managers/patient-sources/")
      .then(setSources)
      .catch(() => setSources([]));
  }, []);

  function set(field) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
        recall_date: form.recall_date || null,
        height: form.height === "" ? null : Number(form.height),
        weight: form.weight === "" ? null : Number(form.weight),
        patient_source_id: form.patient_source_id ? Number(form.patient_source_id) : null,
      };
      const patient = await api.post("/clinic/patients/", payload);
      navigate(`/patients/${patient.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Add Patient"
      actions={
        <Link to="/patients" className="text-sm text-turquoise-600 hover:underline">
          ← Back to patients
        </Link>
      }
    >
      {error && (
        <div className="mb-4 text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Section title="Identity" icon={<EndlessKnot className="w-5 h-5 text-saffron-400" />}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Patient ID" hint="Leave blank to auto-generate" value={form.patient_code} onChange={set("patient_code")} />
            <Field label="Nickname" value={form.nickname} onChange={set("nickname")} />
            <SelectField
              label="Gender"
              required
              value={form.gender}
              onChange={set("gender")}
              options={[
                { value: "", label: "Select Gender" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Field label="First name" required value={form.first_name} onChange={set("first_name")} />
            <Field label="Middle name" value={form.middle_name} onChange={set("middle_name")} />
            <Field label="Last name" required value={form.last_name} onChange={set("last_name")} />
            <Field label="Suffix" value={form.suffix} onChange={set("suffix")} placeholder="Jr., III…" />
          </div>
        </Section>

        <Section title="Contact information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" type="email" value={form.email} onChange={set("email")} />
            <Field label="Contact number" value={form.phone} onChange={set("phone")} />
          </div>
          <Field label="Address" value={form.address} onChange={set("address")} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Birthdate" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
            <Field label="Profession / Job" value={form.job_title} onChange={set("job_title")} />
          </div>
        </Section>

        <Section title="Vitals">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)" type="number" step="0.1" value={form.height} onChange={set("height")} />
            <Field label="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={set("weight")} />
          </div>
        </Section>

        <Section title="Emergency contact & recall">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact person name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
            <Field label="Contact person number" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
          </div>
          <Field label="Re-call date" type="date" value={form.recall_date} onChange={set("recall_date")} />
        </Section>

        <Section title="Allergies">
          <label className="flex items-center gap-2 text-sm text-maroon-700 mb-3">
            <input
              type="checkbox"
              checked={form.has_allergies}
              onChange={set("has_allergies")}
              className="rounded border-maroon-300 text-maroon-700 focus:ring-turquoise-400"
            />
            Does this patient have allergies?
          </label>
          {form.has_allergies && (
            <Field
              label="Specify allergies"
              value={form.allergies}
              onChange={set("allergies")}
              placeholder="e.g. Penicillin, Latex"
            />
          )}
        </Section>

        <Section title="Additional information">
          <SelectField
            label="How did you hear about us?"
            value={form.patient_source_id}
            onChange={set("patient_source_id")}
            options={[
              { value: "", label: "Please select" },
              ...sources.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
          <Field label="Notes" value={form.notes} onChange={set("notes")} textarea />
        </Section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg px-6 py-2.5"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link
            to="/patients"
            className="border border-maroon-200 text-maroon-600 hover:border-maroon-400 rounded-lg px-6 py-2.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </PageShell>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-saffron-200 p-6">
      <h2 className="flex items-center gap-2 text-maroon-800 font-semibold mb-4">
        {icon}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, className = "", hint, textarea, ...rest }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-maroon-700 mb-1">{label}</label>
      <Comp
        type={textarea ? undefined : type}
        required={required}
        value={value}
        onChange={onChange}
        rows={textarea ? 3 : undefined}
        className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
        {...rest}
      />
      {hint && <p className="text-xs text-maroon-400 mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-maroon-700 mb-1">{label}</label>
      <select
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
