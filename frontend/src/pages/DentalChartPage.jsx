import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import { CONDITIONS, DENTITIONS, conditionMeta, rowsFor, toothLabel } from "../lib/dentalChart";

export default function DentalChartPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [chart, setChart] = useState([]);
  const [notes, setNotes] = useState([]);
  const [system, setSystem] = useState("universal");
  const [error, setError] = useState("");
  const [hoverTooth, setHoverTooth] = useState(null);
  const [selected, setSelected] = useState([]);
  const [savingDentition, setSavingDentition] = useState(false);
  const [procedures, setProcedures] = useState([]);

  useEffect(() => {
    api
      .get("/clinic/managers/procedures/")
      .then(setProcedures)
      .catch(() => setProcedures([]));
  }, []);

  function procedureNames(ids) {
    if (!ids || ids.length === 0) return [];
    return ids
      .map((pid) => procedures.find((p) => p.id === pid)?.name)
      .filter(Boolean);
  }

  const dentition = patient?.dentition || null;

  function loadPatient() {
    setError("");
    api
      .get(`/clinic/patients/${id}`)
      .then(async (p) => {
        setPatient(p);
        if (p.dentition) {
          loadChartAndNotes(p.dentition);
          return;
        }
        // Patient predates the dentition field, or it was never set --
        // if teeth were already picked/recorded before, infer the
        // dentition from that history instead of asking again.
        try {
          const existingNotes = await api.get(
            `/clinic/patients/dental-notes/?patient_id=${id}`
          );
          if (existingNotes.length > 0) {
            const inferred = existingNotes[0].dentition === "pediatric" ? "pediatric" : "adult";
            await chooseDentition(inferred);
          }
        } catch (err) {
          setError(err.message);
        }
      })
      .catch((err) => setError(err.message));
  }

  function loadChartAndNotes(dentitionValue) {
    Promise.all([
      api.get(`/clinic/patients/${id}/dental-chart?dentition=${dentitionValue}`),
      api.get(`/clinic/patients/dental-notes/?patient_id=${id}`),
    ])
      .then(([c, n]) => {
        setChart(c);
        setNotes(n);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function reload() {
    if (dentition) loadChartAndNotes(dentition);
  }

  async function chooseDentition(value) {
    setSavingDentition(true);
    setError("");
    try {
      const updated = await api.patch(`/clinic/patients/${id}`, { dentition: value });
      setPatient(updated);
      loadChartAndNotes(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDentition(false);
    }
  }

  function changeDentition() {
    if (
      !window.confirm(
        "Change this patient's dentition? Their dental chart and notes will switch to the other layout. Existing notes aren't deleted, just hidden until you switch back."
      )
    ) {
      return;
    }
    setPatient((p) => ({ ...p, dentition: null }));
    setSelected([]);
  }

  async function deleteNote(noteId) {
    if (!window.confirm("Delete this dental note?")) return;
    try {
      await api.delete(`/clinic/dental-notes/${noteId}`);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const chartByTooth = new Map(chart.map((c) => [c.tooth_number, c]));
  const rows = dentition ? rowsFor(dentition) : { upper: [], lower: [] };
  const notesForDentition = notes.filter((n) => n.dentition === dentition);

  const fullName = patient
    ? [patient.first_name, patient.middle_name, patient.last_name, patient.suffix]
        .filter(Boolean)
        .join(" ")
    : "";

  function toggleTooth(tooth) {
    setSelected((prev) => (prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]));
  }

  async function clearSelection() {
    const matches = notes.filter(
      (n) => n.dentition === dentition && n.tooth_number != null && selected.includes(n.tooth_number)
    );
    if (matches.length === 0) {
      setSelected([]);
      return;
    }
    const teethLabel = [...selected]
      .sort((a, b) => a - b)
      .map((t) => toothLabel(t, dentition, system))
      .join(", ");
    if (
      !window.confirm(
        `Clear selection and delete ${matches.length} note${
          matches.length === 1 ? "" : "s"
        } for tooth ${teethLabel}? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await Promise.all(matches.map((n) => api.delete(`/clinic/dental-notes/${n.id}`)));
      setSelected([]);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  function goToNote() {
    if (selected.length === 0) return;
    const teeth = [...selected].sort((a, b) => a - b).join(",");
    navigate(
      `/patients/${id}/dental-notes/add?teeth=${teeth}&dentition=${dentition}&fromChart=true`
    );
  }

  async function clearToothCondition(tooth) {
    const matches = notes.filter(
      (n) => n.dentition === dentition && n.tooth_number === tooth && n.condition != null
    );
    if (matches.length === 0) return;
    const label = toothLabel(tooth, dentition, system);
    if (
      !window.confirm(
        `Clear the recorded condition on tooth ${label}? This deletes ${matches.length} note${
          matches.length === 1 ? "" : "s"
        } with a condition set on it.`
      )
    ) {
      return;
    }
    try {
      await Promise.all(matches.map((n) => api.delete(`/clinic/dental-notes/${n.id}`)));
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) {
    return (
      <PageShell title="Dental chart">
        <p className="text-maroon-600">{error}</p>
      </PageShell>
    );
  }

  if (!patient) {
    return (
      <PageShell title="Dental chart">
        <p className="text-maroon-400">Loading…</p>
      </PageShell>
    );
  }

  if (!dentition) {
    return (
      <PageShell
        title={`Dental chart — ${fullName}`}
        actions={
          <Link to={`/patients/${id}`} className="text-sm text-turquoise-600 hover:underline">
            ← Back to patient
          </Link>
        }
      >
        <div className="bg-white rounded-2xl border border-saffron-200 p-8 max-w-lg mx-auto text-center">
          <h2 className="text-maroon-800 font-semibold text-lg mb-2">
            Is {fullName || "this patient"} adult or pediatric?
          </h2>
          <p className="text-sm text-maroon-500 mb-6">
            This decides the dental chart layout for this patient (32 permanent teeth vs. 20
            primary teeth). You can change it later if needed.
          </p>
          <div className="flex items-center justify-center gap-4">
            {DENTITIONS.map((d) => (
              <button
                key={d.value}
                disabled={savingDentition}
                onClick={() => chooseDentition(d.value)}
                className="flex-1 max-w-[180px] border-2 border-maroon-200 hover:border-maroon-700 rounded-xl px-4 py-4 text-left disabled:opacity-60"
              >
                <div className="text-maroon-800 font-semibold">{d.label}</div>
                <div className="text-xs text-maroon-400 mt-0.5">{d.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  const fdiRange = dentition === "pediatric" ? "51-85" : "11-48";
  const universalLabel = dentition === "pediatric" ? "Letters (A-T)" : "Universal (1-32)";
  const dentitionMeta = DENTITIONS.find((d) => d.value === dentition);

  return (
    <PageShell
      title={`Dental chart — ${fullName}`}
      actions={
        <div className="flex items-center gap-4">
          <Link
            to={`/patients/${id}`}
            className="text-sm text-turquoise-600 hover:underline"
          >
            ← Back to patient
          </Link>
          <Link
            to={`/patients/${id}/dental-notes/add?dentition=${dentition}&fromChart=true`}
            className="bg-maroon-700 hover:bg-maroon-600 text-parchment-50 text-xs font-medium rounded-lg px-3 py-1.5"
          >
            + Add dental note
          </Link>
        </div>
      }
    >
      <div className="bg-white rounded-2xl border border-saffron-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="bg-maroon-700 text-parchment-50 text-xs font-semibold rounded-full px-3 py-1.5">
              {dentitionMeta?.label} patient
            </span>
            <button
              onClick={changeDentition}
              className="text-xs text-turquoise-600 hover:underline"
            >
              Change
            </button>
          </div>
          <div className="inline-flex rounded-lg border border-maroon-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setSystem("universal")}
              className={`px-3 py-1.5 ${
                system === "universal"
                  ? "bg-maroon-700 text-parchment-50"
                  : "bg-white text-maroon-700 hover:bg-parchment-100"
              }`}
            >
              {universalLabel}
            </button>
            <button
              onClick={() => setSystem("fdi")}
              className={`px-3 py-1.5 border-l border-maroon-200 ${
                system === "fdi"
                  ? "bg-maroon-700 text-parchment-50"
                  : "bg-white text-maroon-700 hover:bg-parchment-100"
              }`}
            >
              FDI ({fdiRange})
            </button>
          </div>
        </div>

        <p className="text-sm text-maroon-500 mb-4">
          Click teeth to select them — multiple can be selected at once. A colored tooth has a
          small × to clear its condition directly.
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[560px] mx-auto">
            <ToothRow
              teeth={rows.upper}
              dentition={dentition}
              system={system}
              chartByTooth={chartByTooth}
              hoverTooth={hoverTooth}
              setHoverTooth={setHoverTooth}
              selected={selected}
              onToggle={toggleTooth}
              onClearCondition={clearToothCondition}
              flip={false}
            />
            <div className="border-t border-dashed border-saffron-300 my-3" />
            <ToothRow
              teeth={rows.lower}
              dentition={dentition}
              system={system}
              chartByTooth={chartByTooth}
              hoverTooth={hoverTooth}
              setHoverTooth={setHoverTooth}
              selected={selected}
              onToggle={toggleTooth}
              onClearCondition={clearToothCondition}
              flip={true}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {CONDITIONS.map((c) => (
            <div key={c.value} className="flex items-center gap-1.5 text-xs text-maroon-700">
              <span
                className="w-3.5 h-3.5 rounded-full border"
                style={{ backgroundColor: c.color, borderColor: c.border }}
              />
              {c.label}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-saffron-200 p-6 mt-6">
        <h2 className="text-maroon-800 font-semibold mb-4">Dental notes</h2>
        {notesForDentition.length === 0 ? (
          <p className="text-sm text-maroon-400">No dental notes yet.</p>
        ) : (
          <ul className="divide-y divide-saffron-100 text-sm">
            {notesForDentition.map((n) => {
              const meta = conditionMeta(n.condition);
              return (
                <li key={n.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {n.tooth_number != null && (
                          <span className="text-maroon-800 font-medium">
                            Tooth {toothLabel(n.tooth_number, n.dentition, system)}
                          </span>
                        )}
                        {meta && <ConditionBadge condition={n.condition} />}
                        <span className="text-maroon-400 text-xs">— {n.note_date}</span>
                      </div>
                      {n.title && (
                        <div className="text-maroon-800 font-medium mt-0.5">{n.title}</div>
                      )}
                      {procedureNames(n.procedure_ids).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {procedureNames(n.procedure_ids).map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center bg-turquoise-50 border border-turquoise-200 text-turquoise-700 text-xs font-medium rounded-full px-2 py-0.5"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-maroon-600 mt-1 whitespace-pre-wrap">{n.content}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="shrink-0 text-maroon-400 hover:text-maroon-700 border border-transparent hover:border-maroon-200 rounded-lg p-1.5"
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1a.75.75 0 0 0-.75.75V3H4.5a.75.75 0 0 0 0 1.5h.325l.732 10.25A2.25 2.25 0 0 0 7.8 16.75h4.4a2.25 2.25 0 0 0 2.243-2.05L15.175 4.5H15.5a.75.75 0 0 0 0-1.5H12v-1.25a.75.75 0 0 0-.75-.75h-2.5ZM10 4.5H5.834l.72 10.14a.75.75 0 0 0 .748.61h4.396a.75.75 0 0 0 .748-.61l.72-10.14H10Zm-1.25 2.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6a.75.75 0 0 1 .75-.75Zm3.25.75a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0v-6Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-maroon-800 text-parchment-50 rounded-2xl shadow-lg px-5 py-3 flex items-center gap-4 z-10">
          <span className="text-sm font-medium">
            {selected.length} tooth{selected.length === 1 ? "" : "s"} selected:{" "}
            {[...selected]
              .sort((a, b) => a - b)
              .map((t) => toothLabel(t, dentition, system))
              .join(", ")}
          </span>
          <button
            onClick={clearSelection}
            className="text-xs text-parchment-200 hover:text-parchment-50 underline"
          >
            Clear
          </button>
          <button
            onClick={goToNote}
            className="bg-turquoise-500 hover:bg-turquoise-400 text-maroon-900 text-xs font-semibold rounded-lg px-3 py-1.5"
          >
            Add note for selected teeth
          </button>
        </div>
      )}
    </PageShell>
  );
}

function ToothRow({
  teeth,
  dentition,
  system,
  chartByTooth,
  hoverTooth,
  setHoverTooth,
  selected,
  onToggle,
  onClearCondition,
  flip,
}) {
  return (
    <div className="flex gap-1.5">
      {teeth.map((tooth) => {
        const entry = chartByTooth.get(tooth);
        const meta = conditionMeta(entry?.condition);
        const isHover = hoverTooth === tooth;
        const isSelected = selected.includes(tooth);
        const label = toothLabel(tooth, dentition, system);
        return (
          <div
            key={tooth}
            className="relative flex-1"
            onMouseEnter={() => setHoverTooth(tooth)}
            onMouseLeave={() => setHoverTooth(null)}
          >
            {meta && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCondition(tooth);
                }}
                title={`Clear condition on tooth ${label}`}
                aria-label={`Clear condition on tooth ${label}`}
                className={`absolute top-0 right-1 z-10 w-4 h-4 flex items-center justify-center rounded-full bg-maroon-800 text-white text-[10px] leading-none transition-opacity ${
                  isHover ? "opacity-100" : "opacity-0"
                }`}
              >
                ×
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggle(tooth)}
              title={`Tooth ${label}${meta ? ` — ${meta.label}` : ""}`}
              className={`w-full flex flex-col items-center gap-1 group rounded-lg py-1 ${
                isSelected ? "bg-turquoise-100" : ""
              }`}
            >
              {!flip && <ToothLabel isSelected={isSelected}>{label}</ToothLabel>}
              <ToothShape
                filled={meta?.color || "#ffffff"}
                stroke={isSelected ? "#0d9488" : isHover ? "#1976d2" : meta?.border || "#c9b28a"}
                strokeWidth={isSelected ? 3 : 2}
                missing={entry?.condition === "missing"}
              />
              {flip && <ToothLabel isSelected={isSelected}>{label}</ToothLabel>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConditionBadge({ condition }) {
  const meta = conditionMeta(condition);
  if (!meta) return null;
  const isLight = meta.value === "healthy";
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5 border"
      style={{
        backgroundColor: meta.color,
        borderColor: meta.border,
        color: isLight ? "#7a1f1f" : "#ffffff",
      }}
    >
      {meta.label}
    </span>
  );
}

function ToothLabel({ isSelected, children }) {
  return (
    <span
      className={`text-[10px] font-semibold rounded-full min-w-[18px] px-1.5 py-0.5 text-center leading-none ${
        isSelected ? "bg-turquoise-600 text-white shadow-sm" : "text-maroon-500"
      }`}
    >
      {children}
    </span>
  );
}

function ToothShape({ filled, stroke, strokeWidth = 2, missing }) {
  return (
    <svg viewBox="0 0 40 52" className="w-full max-w-[44px] h-12">
      <path
        d="M20 2c-8 0-11 6-11 13 0 8 3 20 6 28 1.5 4 3 6 5 6s3.5-2 5-6c3-8 6-20 6-28 0-7-3-13-11-13Z"
        fill={missing ? "#f3f4f6" : filled}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={missing ? "3 3" : "0"}
        className="transition-colors group-hover:brightness-95"
      />
      {missing && (
        <path
          d="M12 12 L28 40 M28 12 L12 40"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
