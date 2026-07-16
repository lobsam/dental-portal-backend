import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import { EndlessKnot } from "../components/TibetanMotif";

export default function DashboardHome() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/clinic/patients/"),
      api.get("/clinic/patients/appointments/"),
      api.get("/clinic/appointment-requests/?status_filter=pending"),
    ])
      .then(([p, a, r]) => {
        setPatients(p);
        setAppointments(a);
        setRequests(r);
      })
      .catch((err) => setError(err.message));
  }, []);

  const today = new Date().toDateString();
  const todaysAppointments = appointments.filter(
    (a) => new Date(a.start_time).toDateString() === today
  );

  return (
    <PageShell title="Dashboard">
      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total patients" value={patients.length} to="/patients" />
        <StatCard label="Today's appointments" value={todaysAppointments.length} to="/appointments" />
        <StatCard label="Pending requests" value={requests.length} to="/appointments" accent />
      </div>

      <div className="bg-white rounded-2xl border border-saffron-200 p-6 relative overflow-hidden">
        <EndlessKnot className="absolute -right-4 -top-4 w-28 h-28 text-saffron-100" />
        <h2 className="text-maroon-800 font-semibold mb-4 relative">Today&apos;s schedule</h2>
        {todaysAppointments.length === 0 ? (
          <p className="text-sm text-maroon-400 relative">No appointments scheduled for today.</p>
        ) : (
          <ul className="divide-y divide-saffron-100 relative">
            {todaysAppointments.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                <span className="text-maroon-800">
                  {new Date(a.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  — {a.appointment_type || "Appointment"}
                </span>
                <StatusPill status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({ label, value, to, accent }) {
  return (
    <Link
      to={to}
      className={`rounded-2xl p-5 border transition-shadow hover:shadow-md ${
        accent
          ? "bg-saffron-50 border-saffron-300"
          : "bg-white border-saffron-200"
      }`}
    >
      <p className="text-sm text-maroon-500">{label}</p>
      <p className="text-3xl font-semibold text-maroon-800 mt-1">{value}</p>
    </Link>
  );
}

export function StatusPill({ status }) {
  const styles = {
    confirmed: "bg-turquoise-100 text-turquoise-700",
    checked_in: "bg-saffron-100 text-saffron-700",
    completed: "bg-maroon-100 text-maroon-700",
    cancelled: "bg-gray-100 text-gray-500",
    no_show: "bg-gray-100 text-gray-500",
    pending: "bg-saffron-100 text-saffron-700",
    declined: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status?.replace("_", " ")}
    </span>
  );
}
