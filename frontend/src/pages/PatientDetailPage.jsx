import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import Modal from "../components/Modal";
import { TextField } from "./PatientsPage";
import { StatusPill } from "./DashboardHome";

const emptyItem = { procedure_id: "", tooth_number: "", description: "", cost: "" };
const emptyPlanForm = { name: "", plan_date: "", notes: "" };

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [sources, setSources] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [error, setError] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ ...emptyPlanForm });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);

  function load() {
    setError("");
    Promise.all([
      api.get(`/clinic/patients/${id}`),
      api.get(`/clinic/patients/appointments/?patient_id=${id}`),
      api.get(`/clinic/patients/treatment-plans/?patient_id=${id}`),
      api.get(`/clinic/managers/patient-sources/`).catch(() => []),
      api.get(`/clinic/managers/procedures/`).catch(() => []),
    ])
      .then(([p, a, t, s, procs]) => {
        setPatient(p);
        setAppointments(a);
        setPlans(t);
        setSources(s);
        setProcedures(procs.filter((x) => x.is_active));
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function updateItem(index, patch) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItemRow(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function selectProcedure(index, procedureId) {
    const proc = procedures.find((p) => p.id === Number(procedureId));
    updateItem(index, {
      procedure_id: procedureId,
      description: proc ? proc.name : "",
      cost: proc && proc.default_cost != null ? String(proc.default_cost) : "",
    });
  }

  function openPlanModal() {
    setPlanForm({ ...emptyPlanForm });
    setItems([{ ...emptyItem }]);
    setShowPlanModal(true);
  }

  async function handleCreatePlan(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payloadItems = items
        .filter((it) => it.procedure_id || it.description)
        .map((it) => ({
          procedure_id: it.procedure_id ? Number(it.procedure_id) : null,
          tooth_number: it.tooth_number || null,
          description: it.description || null,
          cost: it.cost === "" ? null : Number(it.cost),
        }));
      await api.post("/clinic/patients/treatment-plans/", {
        patient_id: Number(id),
        name: planForm.name || null,
        plan_date: planForm.plan_date || null,
        notes: planForm.notes || null,
        items: payloadItems,
      });
      setShowPlanModal(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function planTotal(plan) {
    return plan.items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }

  const sourceName = patient
    ? sources.find((s) => s.id === patient.patient_source_id)?.name
    : null;

  const fullName = patient
    ? [patient.first_name, patient.middle_name, patient.last_name, patient.suffix]
        .filter(Boolean)
        .join(" ")
    : "";

  if (error) {
    return (
      <PageShell title="Patient">
        <p className="text-maroon-600">{error}</p>
      </PageShell>
    );
  }

  if (!patient) {
    return (
      <PageShell title="Patient">
        <p className="text-maroon-400">Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={fullName}
      actions={
        <Link to="/patients" className="text-sm text-turquoise-600 hover:underline">
          ← Back to patients
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-4">Identity</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Patient ID" value={patient.patient_code} />
              <Row label="Nickname" value={patient.nickname} />
              <Row label="Gender" value={patient.gender} />
              <Row label="Date of birth" value={patient.date_of_birth} />
              <Row label="Profession" value={patient.job_title} />
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-4">Contact</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Phone" value={patient.phone} />
              <Row label="Email" value={patient.email} />
              <Row label="Address" value={patient.address} />
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-4">Vitals</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Height" value={patient.height ? `${patient.height} cm` : null} />
              <Row label="Weight" value={patient.weight ? `${patient.weight} kg` : null} />
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-4">Emergency & recall</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Contact name" value={patient.emergency_contact_name} />
              <Row label="Contact number" value={patient.emergency_contact_phone} />
              <Row label="Re-call date" value={patient.recall_date} />
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-4">Allergies</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Has allergies" value={patient.has_allergies ? "Yes" : "No"} />
              {patient.has_allergies && <Row label="Details" value={patient.allergies} />}
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-4">Additional</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Referral source" value={sourceName} />
              <Row label="Notes" value={patient.notes} />
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-4">Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-sm text-maroon-400">No appointments yet.</p>
            ) : (
              <ul className="divide-y divide-saffron-100">
                {appointments.map((a) => (
                  <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-maroon-800">
                      {new Date(a.start_time).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <StatusPill status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-maroon-800 font-semibold">Treatment plans</h2>
              <button
                onClick={openPlanModal}
                className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-xs font-medium rounded-lg px-3 py-1.5"
              >
                + New treatment plan
              </button>
            </div>
            {plans.length === 0 ? (
              <p className="text-sm text-maroon-400">No treatment plans yet.</p>
            ) : (
              <ul className="divide-y divide-saffron-100">
                {plans.map((plan) => (
                  <li key={plan.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-maroon-800 font-medium">
                        {plan.name || `Plan #${plan.id}`}
                        {plan.plan_date ? ` — ${plan.plan_date}` : ""}
                      </span>
                      <StatusPill status={plan.status} />
                    </div>
                    <div className="text-maroon-500 mt-0.5">
                      {plan.items.length} item{plan.items.length === 1 ? "" : "s"} · $
                      {planTotal(plan).toFixed(2)}
                      {plan.notes ? ` — ${plan.notes}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="New treatment plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Plan name"
              value={planForm.name}
              onChange={(v) => setPlanForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Full mouth restoration"
            />
            <div>
              <label className="block text-sm font-medium text-maroon-700 mb-1">Date</label>
              <input
                type="date"
                value={planForm.plan_date}
                onChange={(e) => setPlanForm((f) => ({ ...f, plan_date: e.target.value }))}
                className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-maroon-700">Procedures</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-turquoise-600 hover:underline font-medium"
              >
                + Add procedure
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_80px_90px_auto] gap-2 items-start bg-parchment-50 border border-saffron-100 rounded-lg p-2"
                >
                  <select
                    value={item.procedure_id}
                    onChange={(e) => selectProcedure(idx, e.target.value)}
                    className="rounded-lg border border-maroon-200 px-2 py-1.5 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
                  >
                    <option value="">Select procedure…</option>
                    {procedures.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={item.tooth_number}
                    onChange={(e) => updateItem(idx, { tooth_number: e.target.value })}
                    placeholder="Tooth #"
                    className="rounded-lg border border-maroon-200 px-2 py-1.5 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
                  />
                  <input
                    type="number"
                    value={item.cost}
                    onChange={(e) => updateItem(idx, { cost: e.target.value })}
                    placeholder="Cost"
                    className="rounded-lg border border-maroon-200 px-2 py-1.5 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="text-maroon-400 hover:text-maroon-700 text-sm px-1.5 py-1.5"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={planForm.notes}
              onChange={(e) => setPlanForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5"
          >
            {saving ? "Creating…" : "Create plan"}
          </button>
        </form>
      </Modal>
    </PageShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-maroon-400">{label}</dt>
      <dd className="text-maroon-800 text-right">{value || "—"}</dd>
    </div>
  );
}
