import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import { TextField } from "./PatientsPage";
import { CONDITIONS, DENTITIONS, toothLabel } from "../lib/dentalChart";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function maxTooth(dentition) {
  return dentition === "pediatric" ? 20 : 32;
}

function parseTeethParam(searchParams, dentition) {
  const max = maxTooth(dentition);
  const teethParam = searchParams.get("teeth");
  if (teethParam) {
    return [...new Set(teethParam.split(",").map(Number).filter((n) => n >= 1 && n <= max))].sort(
      (a, b) => a - b
    );
  }
  const toothParam = searchParams.get("tooth");
  if (toothParam) {
    const n = Number(toothParam);
    return n >= 1 && n <= max ? [n] : [];
  }
  return [];
}

export default function DentalNoteAddPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromChart = searchParams.get("fromChart") === "true";
  const initialDentition =
    searchParams.get("dentition") === "pediatric" ? "pediatric" : "adult";

  const [patient, setPatient] = useState(null);
  const [dentition, setDentition] = useState(initialDentition);
  const [procedures, setProcedures] = useState([]);
  const [procedureIds, setProcedureIds] = useState([]);
  const [teeth, setTeeth] = useState(() => parseTeethParam(searchParams, initialDentition));
  const [toothInput, setToothInput] = useState("");
  // If we arrived with teeth already picked on the chart, the manual
  // add-a-tooth row is just clutter -- collapse it behind a link.
  const [showAddTooth, setShowAddTooth] = useState(
    () => parseTeethParam(searchParams, initialDentition).length === 0
  );
  const [form, setForm] = useState({
    condition: "",
    title: "",
    content: "",
    note_date: todayIso(),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/clinic/patients/${id}`)
      .then((p) => {
        setPatient(p);
        // Dentition is fixed per patient -- if this page was reached with a
        // stale/mismatched dentition in the URL, correct it to the
        // patient's actual value rather than letting the two disagree.
        if (p.dentition && p.dentition !== dentition) {
          setDentition(p.dentition);
          setTeeth([]);
        }
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    api
      .get("/clinic/managers/procedures/")
      .then((data) => setProcedures(data.filter((p) => p.is_active)))
      .catch(() => setProcedures([]));
  }, []);

  function toggleProcedure(procId) {
    setProcedureIds((prev) =>
      prev.includes(procId) ? prev.filter((p) => p !== procId) : [...prev, procId]
    );
  }

  const fullName = patient
    ? [patient.first_name, patient.middle_name, patient.last_name, patient.suffix]
        .filter(Boolean)
        .join(" ")
    : "";

  function addTooth() {
    const n = Number(toothInput);
    const max = maxTooth(dentition);
    if (!n || n < 1 || n > max) return;
    setTeeth((prev) => (prev.includes(n) ? prev : [...prev, n].sort((a, b) => a - b)));
    setToothInput("");
  }

  function removeTooth(n) {
    setTeeth((prev) => prev.filter((t) => t !== n));
  }

  function handleToothKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTooth();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.content.trim()) {
      setError("Note content is required.");
      return;
    }
    if (!form.note_date) {
      setError("Date is required.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/clinic/patients/dental-notes/", {
        patient_id: Number(id),
        dentition,
        tooth_numbers: teeth.length > 0 ? teeth : null,
        condition: form.condition || null,
        procedure_ids: procedureIds.length > 0 ? procedureIds : null,
        title: form.title || null,
        content: form.content,
        note_date: form.note_date,
      });
      navigate(fromChart ? `/patients/${id}/dental-chart` : `/patients/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const backTo = fromChart ? `/patients/${id}/dental-chart` : `/patients/${id}`;
  const max = maxTooth(dentition);
  const dentitionInfo = DENTITIONS.find((d) => d.value === dentition);

  return (
    <PageShell
      title={`Add dental note${fullName ? ` — ${fullName}` : ""}`}
      actions={
        <Link to={backTo} className="text-sm text-turquoise-600 hover:underline">
          ← {fromChart ? "Back to dental chart" : "Back to patient"}
        </Link>
      }
    >
      <div className="bg-white rounded-2xl border border-saffron-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">Dentition</label>
            <span className="inline-flex items-center bg-maroon-700 text-parchment-50 text-xs font-semibold rounded-full px-3 py-1.5">
              {dentitionInfo?.label || "Adult"} patient
            </span>
            <p className="text-xs text-maroon-400 mt-1">
              Fixed per patient — change it from the dental chart page if needed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-maroon-700 mb-1">
                Teeth {teeth.length > 1 ? `(${teeth.length} selected)` : ""}
              </label>
              {teeth.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {teeth.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 bg-turquoise-50 border border-turquoise-200 text-turquoise-700 text-xs font-medium rounded-full pl-2.5 pr-1.5 py-1"
                    >
                      Tooth {toothLabel(t, dentition, "universal")} (FDI{" "}
                      {toothLabel(t, dentition, "fdi")})
                      <button
                        type="button"
                        onClick={() => removeTooth(t)}
                        className="hover:text-maroon-700"
                        aria-label={`Remove tooth ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {showAddTooth ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={max}
                      value={toothInput}
                      onChange={(e) => setToothInput(e.target.value)}
                      onKeyDown={handleToothKeyDown}
                      placeholder={dentition === "pediatric" ? "1-20 (A-T)" : "Universal 1-32"}
                      className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
                    />
                    <button
                      type="button"
                      onClick={addTooth}
                      className="shrink-0 bg-parchment-100 hover:bg-parchment-200 border border-maroon-200 text-maroon-700 text-sm font-medium rounded-lg px-3"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-maroon-400 mt-1">
                    Optional — leave empty for a general note not tied to a tooth.
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddTooth(true)}
                  className="text-xs text-turquoise-600 hover:underline font-medium"
                >
                  + Add another tooth
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-maroon-700 mb-1">
                Date <span className="text-maroon-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.note_date}
                onChange={(e) => setForm((f) => ({ ...f, note_date: e.target.value }))}
                className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
              className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
            >
              <option value="">None</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-maroon-400 mt-1">
              Setting a condition applies it to every selected tooth on the dental chart.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">
              Procedures {procedureIds.length > 0 ? `(${procedureIds.length} selected)` : ""}
            </label>
            {procedures.length === 0 ? (
              <p className="text-xs text-maroon-400">
                No procedures set up yet — add some under{" "}
                <Link to="/managers/procedures" className="text-turquoise-600 hover:underline">
                  Managers → Procedures
                </Link>
                .
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-maroon-200 divide-y divide-maroon-100">
                {procedures.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-maroon-700 hover:bg-parchment-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={procedureIds.includes(p.id)}
                      onChange={() => toggleProcedure(p.id)}
                      className="rounded border-maroon-300 text-maroon-700 focus:ring-turquoise-400"
                    />
                    <span className="flex-1">{p.name}</span>
                    {p.default_cost != null && (
                      <span className="text-xs text-maroon-400">${Number(p.default_cost).toFixed(2)}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <TextField
            label="Title"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="Optional short summary"
          />

          <div>
            <label className="block text-sm font-medium text-maroon-700 mb-1">
              Note <span className="text-maroon-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5"
          >
            {saving ? "Saving…" : "Save note"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
