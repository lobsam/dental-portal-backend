import { useEffect, useState } from "react";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import Modal from "../components/Modal";
import { TextField } from "./PatientsPage";
import { StatusPill } from "./DashboardHome";

export default function AppointmentsPage() {
  const [tab, setTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patient_id: "", start_time: "", end_time: "", appointment_type: "" });
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    try {
      const [a, r, p] = await Promise.all([
        api.get("/clinic/patients/appointments/"),
        api.get("/clinic/appointment-requests/?status_filter=pending"),
        api.get("/clinic/patients/"),
      ]);
      setAppointments(a);
      setRequests(r);
      setPatients(p);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/clinic/patients/appointments/", {
        ...form,
        patient_id: Number(form.patient_id),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      setShowModal(false);
      setForm({ patient_id: "", start_time: "", end_time: "", appointment_type: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmRequest(id) {
    try {
      await api.post(`/clinic/appointment-requests/${id}/confirm`, {});
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function declineRequest(id) {
    try {
      await api.post(`/clinic/appointment-requests/${id}/decline`, { reason: "Not available" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function patientName(patientId) {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.first_name} ${p.last_name}` : `Patient #${patientId}`;
  }

  return (
    <PageShell
      title="Appointments"
      actions={
        <>
          <div className="inline-flex rounded-lg border border-maroon-200 overflow-hidden">
            <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
              Upcoming ({appointments.length})
            </TabButton>
            <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>
              Requests ({requests.length})
            </TabButton>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-sm font-medium rounded-lg px-4 py-2"
          >
            + New Appointment
          </button>
        </>
      }
    >
      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      {tab === "upcoming" ? (
        <ListCard
          items={appointments}
          empty="No appointments scheduled."
          renderRow={(a) => (
            <>
              <span className="text-maroon-800">{patientName(a.patient_id)}</span>
              <span className="text-maroon-600 text-sm">
                {new Date(a.start_time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <StatusPill status={a.status} />
            </>
          )}
        />
      ) : (
        <ListCard
          items={requests}
          empty="No pending requests."
          renderRow={(r) => (
            <>
              <span className="text-maroon-800">{patientName(r.patient_id)}</span>
              <span className="text-maroon-600 text-sm">
                {new Date(r.requested_start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmRequest(r.id)}
                  className="text-xs bg-turquoise-500 hover:bg-turquoise-600 text-white rounded-lg px-3 py-1.5"
                >
                  Confirm
                </button>
                <button
                  onClick={() => declineRequest(r.id)}
                  className="text-xs bg-white border border-maroon-200 hover:border-maroon-400 text-maroon-600 rounded-lg px-3 py-1.5"
                >
                  Decline
                </button>
              </div>
            </>
          )}
        />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New appointment">
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
          <TextField
            label="Start time"
            type="datetime-local"
            required
            value={form.start_time}
            onChange={(v) => setForm((f) => ({ ...f, start_time: v }))}
          />
          <TextField
            label="End time"
            type="datetime-local"
            required
            value={form.end_time}
            onChange={(v) => setForm((f) => ({ ...f, end_time: v }))}
          />
          <TextField
            label="Type"
            value={form.appointment_type}
            onChange={(v) => setForm((f) => ({ ...f, appointment_type: v }))}
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5"
          >
            {saving ? "Booking…" : "Book appointment"}
          </button>
        </form>
      </Modal>
    </PageShell>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium ${
        active ? "bg-maroon-700 text-parchment-50" : "bg-white text-maroon-600 hover:bg-parchment-100"
      }`}
    >
      {children}
    </button>
  );
}

function ListCard({ items, empty, renderRow }) {
  return (
    <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
      {items.length === 0 ? (
        <p className="p-6 text-sm text-maroon-400 text-center">{empty}</p>
      ) : (
        <ul className="divide-y divide-saffron-100">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
              {renderRow(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
