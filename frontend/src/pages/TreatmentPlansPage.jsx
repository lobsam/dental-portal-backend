import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import Modal from "../components/Modal";
import { TextField } from "./PatientsPage";
import { StatusPill } from "./DashboardHome";

const emptyProcedureForm = { code: "", name: "", category: "", default_cost: "" };

export default function TreatmentPlansPage() {
  const [tab, setTab] = useState("plans");

  return (
    <PageShell
      title="Treatment Plans"
      actions={
        <div className="inline-flex rounded-lg border border-maroon-200 overflow-hidden">
          <TabButton active={tab === "plans"} onClick={() => setTab("plans")}>
            Treatment Plans
          </TabButton>
          <TabButton active={tab === "procedures"} onClick={() => setTab("procedures")}>
            Procedures
          </TabButton>
        </div>
      }
    >
      {tab === "plans" ? <PlansSection /> : <ProceduresSection />}
    </PageShell>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
        active ? "bg-maroon-700 text-parchment-50" : "bg-white text-maroon-600 hover:bg-parchment-100"
      }`}
    >
      {children}
    </button>
  );
}

// --- Treatment Plans (clinic-wide) -----------------------------------------

const emptyItem = { procedure_id: "", tooth_number: "", description: "", cost: "" };

function PlansSection() {
  const [plans, setPlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patient_id: "", name: "", plan_date: "", notes: "" });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [p, pts, procs] = await Promise.all([
        api.get("/clinic/patients/treatment-plans/"),
        api.get("/clinic/patients/"),
        api.get("/clinic/managers/procedures/"),
      ]);
      setPlans(p);
      setPatients(pts);
      setProcedures(procs.filter((x) => x.is_active));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function patientName(patientId) {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.first_name} ${p.last_name}` : `Patient #${patientId}`;
  }

  function planTotal(plan) {
    return plan.items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }

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

  async function handleCreate(e) {
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
        patient_id: Number(form.patient_id),
        name: form.name || null,
        plan_date: form.plan_date || null,
        notes: form.notes || null,
        items: payloadItems,
      });
      setShowModal(false);
      setForm({ patient_id: "", name: "", plan_date: "", notes: "" });
      setItems([{ ...emptyItem }]);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function acceptPlan(id) {
    try {
      await api.post(`/clinic/treatment-plans/${id}/accept`, {});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-maroon-500">
          {loading ? "Loading…" : `${plans.length} treatment plan${plans.length === 1 ? "" : "s"}`}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-sm font-medium rounded-lg px-4 py-2"
        >
          + New Treatment Plan
        </button>
      </div>

      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
        {plans.length === 0 && !loading ? (
          <p className="p-6 text-sm text-maroon-400 text-center">No treatment plans yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-parchment-100 text-maroon-600 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total cost</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-parchment-50">
                  <td className="px-5 py-3 text-maroon-800 font-medium">
                    {plan.name || `Plan #${plan.id}`}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      to={`/patients/${plan.patient_id}`}
                      className="text-maroon-800 font-medium hover:text-turquoise-600"
                    >
                      {patientName(plan.patient_id)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-maroon-600">{plan.plan_date || "—"}</td>
                  <td className="px-5 py-3 text-maroon-600">
                    {plan.items.length} item{plan.items.length === 1 ? "" : "s"}
                  </td>
                  <td className="px-5 py-3 text-maroon-600">${planTotal(plan).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={plan.status} />
                  </td>
                  <td className="px-5 py-3 text-maroon-500 max-w-xs truncate">{plan.notes || "—"}</td>
                  <td className="px-5 py-3">
                    {plan.status === "proposed" && (
                      <button
                        onClick={() => acceptPlan(plan.id)}
                        className="text-xs bg-turquoise-500 hover:bg-turquoise-600 text-white rounded-lg px-3 py-1.5"
                      >
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New treatment plan">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">Patient</label>
            <select
              required
              value={form.patient_id}
              onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
              className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
            >
              <option value="">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Plan name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Full mouth restoration"
            />
            <div>
              <label className="block text-sm font-medium text-maroon-700 mb-1">Date</label>
              <input
                type="date"
                value={form.plan_date}
                onChange={(e) => setForm((f) => ({ ...f, plan_date: e.target.value }))}
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
                        {p.code ? `${p.code} — ${p.name}` : p.name}
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
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
    </div>
  );
}

// --- Procedures catalog (manager) -------------------------------------------

function ProceduresSection() {
  const [procedures, setProcedures] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProcedureForm);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/clinic/managers/procedures/");
      setProcedures(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => procedures.filter((p) => showInactive || p.is_active),
    [procedures, showInactive]
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyProcedureForm);
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      code: p.code || "",
      name: p.name || "",
      category: p.category || "",
      default_cost: p.default_cost ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: form.code || null,
        name: form.name,
        category: form.category || null,
        default_cost: form.default_cost === "" ? null : Number(form.default_cost),
      };
      if (editing) {
        await api.patch(`/clinic/managers/procedures/${editing.id}`, payload);
      } else {
        await api.post("/clinic/managers/procedures/", payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function archiveProcedure(id) {
    try {
      await api.delete(`/clinic/managers/procedures/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reactivateProcedure(p) {
    try {
      await api.patch(`/clinic/managers/procedures/${p.id}`, { is_active: true });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm text-maroon-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-maroon-300 text-maroon-700 focus:ring-turquoise-400"
          />
          Show archived
        </label>
        <button
          onClick={openAdd}
          className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-sm font-medium rounded-lg px-4 py-2"
        >
          + Add Procedure
        </button>
      </div>

      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
        {visible.length === 0 && !loading ? (
          <p className="p-6 text-sm text-maroon-400 text-center">No procedures yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-parchment-100 text-maroon-600 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Default cost</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-100">
              {visible.map((p) => (
                <tr key={p.id} className={`hover:bg-parchment-50 ${!p.is_active ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-maroon-800 font-medium hover:text-turquoise-600 text-left"
                    >
                      {p.name}
                    </button>
                    {!p.is_active && (
                      <span className="ml-2 text-xs text-maroon-400">(archived)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-maroon-600">
                    {p.default_cost != null ? `$${Number(p.default_cost).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.is_active ? (
                      <button
                        onClick={() => archiveProcedure(p.id)}
                        className="text-xs border border-maroon-200 hover:border-maroon-400 text-maroon-600 rounded-lg px-3 py-1.5"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivateProcedure(p)}
                        className="text-xs bg-turquoise-500 hover:bg-turquoise-600 text-white rounded-lg px-3 py-1.5"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit procedure" : "Add procedure"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="e.g. Comprehensive oral evaluation"
          />
          <TextField
            label="Default cost"
            type="number"
            value={form.default_cost}
            onChange={(v) => setForm((f) => ({ ...f, default_cost: v }))}
            placeholder="0.00"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add procedure"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
