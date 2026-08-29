import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import Modal from "../components/Modal";
import { TextField } from "./PatientsPage";
import { StatusPill } from "./DashboardHome";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function sameDay(a, b) {
  return ymd(a) === ymd(b);
}

const emptyForm = {
  patient_id: "",
  provider_id: "",
  start_time: "",
  end_time: "",
  appointment_type: "",
  notes: "",
};

export default function AppointmentsPage() {
  const [tab, setTab] = useState("today");
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

  async function loadAll() {
    try {
      const [a, p, d] = await Promise.all([
        api.get("/clinic/patients/appointments/"),
        api.get("/clinic/patients/"),
        api.get("/clinic/settings/users/").catch(() => []),
      ]);
      setAppointments(a);
      setPatients(p);
      setDentists(d);
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
        provider_id: form.provider_id ? Number(form.provider_id) : null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      setShowModal(false);
      setForm(emptyForm);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(appointmentId, action) {
    try {
      if (action === "approved") await api.post(`/clinic/appointments/${appointmentId}/approve`, {});
      else if (action === "rejected") await api.post(`/clinic/appointments/${appointmentId}/reject`, {});
      else if (action === "pending")
        await api.patch(`/clinic/appointments/${appointmentId}`, { status: "pending" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function patientName(patientId) {
    const p = patients.find((x) => x.id === patientId);
    return p ? `${p.first_name} ${p.last_name}` : `Patient #${patientId}`;
  }

  function dentistName(providerId) {
    const d = dentists.find((x) => x.id === providerId);
    return d ? d.full_name || d.email : null;
  }

  const searched = useMemo(() => {
    if (!search.trim()) return appointments;
    const q = search.trim().toLowerCase();
    return appointments.filter((a) => patientName(a.patient_id).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, search, patients]);

  const now = new Date();
  const todaysAppointments = searched
    .filter((a) => sameDay(new Date(a.start_time), today))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const upcomingAppointments = searched
    .filter((a) => new Date(a.start_time) > now && !sameDay(new Date(a.start_time), today))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const pastAppointments = searched
    .filter((a) => new Date(a.end_time) < now && !sameDay(new Date(a.start_time), today))
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const appointmentsByDay = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const key = ymd(new Date(a.start_time));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return map;
  }, [appointments]);

  const dayCells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const selectedAppointments = (appointmentsByDay.get(ymd(selectedDate)) || []).sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  );

  function openNewAppointment() {
    const base = tab === "calendar" ? selectedDate : today;
    const local = `${ymd(base)}T09:00`;
    setForm({ ...emptyForm, start_time: local });
    setShowModal(true);
  }

  return (
    <PageShell
      title="Appointments"
      actions={
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name…"
            className="rounded-lg border border-maroon-200 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
          />
          <button
            onClick={openNewAppointment}
            className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-sm font-medium rounded-lg px-4 py-2"
          >
            + New Appointment
          </button>
        </>
      }
    >
      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="inline-flex rounded-lg border border-maroon-200 overflow-hidden mb-5">
        <TabButton active={tab === "today"} onClick={() => setTab("today")}>
          Today ({todaysAppointments.length})
        </TabButton>
        <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          Upcoming ({upcomingAppointments.length})
        </TabButton>
        <TabButton active={tab === "past"} onClick={() => setTab("past")}>
          Past ({pastAppointments.length})
        </TabButton>
        <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")}>
          Calendar
        </TabButton>
      </div>

      {tab === "today" && (
        <AppointmentList
          items={todaysAppointments}
          empty="No appointment today."
          patientName={patientName}
          dentistName={dentistName}
          onStatusChange={changeStatus}
        />
      )}
      {tab === "upcoming" && (
        <AppointmentList
          items={upcomingAppointments}
          empty="No upcoming appointments."
          patientName={patientName}
          dentistName={dentistName}
          onStatusChange={changeStatus}
          showDate
        />
      )}
      {tab === "past" && (
        <AppointmentList
          items={pastAppointments}
          empty="No past appointments."
          patientName={patientName}
          dentistName={dentistName}
          onStatusChange={changeStatus}
          showDate
        />
      )}

      {tab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-saffron-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-maroon-800 font-semibold">
                {viewMonth.toLocaleString([], { month: "long", year: "numeric" })}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
                  }
                  className="w-8 h-8 rounded-lg border border-maroon-200 text-maroon-600 hover:border-maroon-400"
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    setSelectedDate(today);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-maroon-200 text-maroon-600 hover:border-maroon-400"
                >
                  Today
                </button>
                <button
                  onClick={() =>
                    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
                  }
                  className="w-8 h-8 rounded-lg border border-maroon-200 text-maroon-600 hover:border-maroon-400"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-medium text-maroon-400 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {dayCells.map((cell, i) => {
                const key = ymd(cell.date);
                const count = (appointmentsByDay.get(key) || []).length;
                const isSelected = sameDay(cell.date, selectedDate);
                const isToday = sameDay(cell.date, today);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`relative aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 transition-colors
                      ${cell.inMonth ? "text-maroon-800" : "text-maroon-300"}
                      ${isSelected ? "bg-maroon-700 text-parchment-50" : "hover:bg-parchment-100"}
                      ${isToday && !isSelected ? "ring-1 ring-turquoise-400" : ""}
                    `}
                  >
                    <span>{cell.date.getDate()}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] leading-none rounded-full px-1.5 py-0.5 ${
                          isSelected ? "bg-parchment-50 text-maroon-700" : "bg-saffron-200 text-maroon-700"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-saffron-200 p-6">
            <h2 className="text-maroon-800 font-semibold mb-1">
              {selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <p className="text-xs text-maroon-400 mb-4">
              {selectedAppointments.length} appointment{selectedAppointments.length === 1 ? "" : "s"}
            </p>
            {selectedAppointments.length === 0 ? (
              <p className="text-sm text-maroon-400">No appointments on this day.</p>
            ) : (
              <ul className="divide-y divide-saffron-100">
                {selectedAppointments.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-maroon-800 font-medium">{patientName(a.patient_id)}</span>
                      <StatusPill status={a.status} />
                    </div>
                    <div className="text-sm text-maroon-500">
                      {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(a.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {a.appointment_type ? ` · ${a.appointment_type}` : ""}
                      {dentistName(a.provider_id) ? ` · ${dentistName(a.provider_id)}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Set an Appointment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">Patient Name</label>
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
          {dentists.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-maroon-700 mb-1">Dentist</label>
              <select
                value={form.provider_id}
                onChange={(e) => setForm((f) => ({ ...f, provider_id: e.target.value }))}
                className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
              >
                <option value="">Unassigned</option>
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Start Time"
              type="datetime-local"
              required
              value={form.start_time}
              onChange={(v) => setForm((f) => ({ ...f, start_time: v }))}
            />
            <TextField
              label="End Time"
              type="datetime-local"
              required
              value={form.end_time}
              onChange={(v) => setForm((f) => ({ ...f, end_time: v }))}
            />
          </div>
          <TextField
            label="Type"
            value={form.appointment_type}
            onChange={(v) => setForm((f) => ({ ...f, appointment_type: v }))}
          />
          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">Remarks</label>
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
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </Modal>
    </PageShell>
  );
}

function buildMonthGrid(monthStart) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({ date, inMonth: date.getMonth() === month });
  }
  return cells;
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

function AppointmentList({ items, empty, patientName, dentistName, onStatusChange, showDate }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-saffron-200 p-6 text-center text-sm text-maroon-400">
        {empty}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
      <ul className="divide-y divide-saffron-100">
        {items.map((a) => (
          <li key={a.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="text-maroon-800 font-medium">{patientName(a.patient_id)}</div>
              <div className="text-sm text-maroon-500">
                {showDate &&
                  `${new Date(a.start_time).toLocaleDateString([], { dateStyle: "medium" })} · `}
                {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" – "}
                {new Date(a.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {a.appointment_type ? ` · ${a.appointment_type}` : ""}
                {dentistName(a.provider_id) ? ` · ${dentistName(a.provider_id)}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={a.status} />
              <select
                value={a.status}
                onChange={(e) => e.target.value !== a.status && onStatusChange(a.id, e.target.value)}
                className="text-xs rounded-lg border border-maroon-200 px-2 py-1.5 text-maroon-600"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
