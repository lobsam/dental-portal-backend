import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import { StatusPill } from "./DashboardHome";

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([
      api.get(`/clinic/patients/${id}`),
      api.get(`/clinic/patients/appointments/?patient_id=${id}`),
      api.get(`/clinic/patients/treatment-plans/?patient_id=${id}`),
    ])
      .then(([p, a, t]) => {
        setPatient(p);
        setAppointments(a);
        setPlans(t);
      })
      .catch((err) => setError(err.message));
  }, [id]);

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
      title={`${patient.first_name} ${patient.last_name}`}
      actions={
        <Link to="/patients" className="text-sm text-turquoise-600 hover:underline">
          ← Back to patients
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-saffron-200 p-6">
          <h2 className="text-maroon-800 font-semibold mb-4">Patient info</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Phone" value={patient.phone} />
            <Row label="Email" value={patient.email} />
            <Row label="Date of birth" value={patient.date_of_birth} />
            <Row label="Gender" value={patient.gender} />
            <Row label="Address" value={patient.address} />
            <Row label="Emergency contact" value={patient.emergency_contact_name} />
          </dl>
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
            <h2 className="text-maroon-800 font-semibold mb-4">Treatment plans</h2>
            {plans.length === 0 ? (
              <p className="text-sm text-maroon-400">No treatment plans yet.</p>
            ) : (
              <ul className="divide-y divide-saffron-100">
                {plans.map((plan) => (
                  <li key={plan.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-maroon-800">
                        {plan.items.length} item{plan.items.length === 1 ? "" : "s"}
                        {plan.notes ? ` — ${plan.notes}` : ""}
                      </span>
                      <StatusPill status={plan.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
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
