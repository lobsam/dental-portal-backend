import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/PageShell";
import Modal from "../components/Modal";
import { TextField } from "./PatientsPage";

const TABS = [
  { key: "procedures", label: "Procedures" },
  { key: "drug-list", label: "Drug List" },
  { key: "expense-categories", label: "Expense Categories" },
];

export default function ManagersPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "procedures";

  return (
    <PageShell
      title="Managers"
      actions={
        <div className="inline-flex rounded-lg border border-maroon-200 overflow-hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => navigate(`/managers/${t.key}`)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-maroon-700 text-parchment-50"
                  : "bg-white text-maroon-600 hover:bg-parchment-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {activeTab === "procedures" && (
        <SimpleCatalogSection
          key="procedures"
          endpoint="/clinic/managers/procedures/"
          fields={[
            { key: "name", label: "Name", required: true, placeholder: "e.g. Comprehensive oral evaluation" },
            { key: "default_cost", label: "Default cost", type: "number", placeholder: "0.00" },
          ]}
          columns={[
            { key: "name", label: "Name" },
            { key: "default_cost", label: "Default cost", money: true },
          ]}
          emptyLabel="No procedures yet."
          addLabel="+ Add Procedure"
          singular="procedure"
        />
      )}
      {activeTab === "drug-list" && (
        <SimpleCatalogSection
          key="drug-list"
          endpoint="/clinic/managers/drug-list/"
          fields={[
            { key: "generic_name", label: "Generic Name", required: true, placeholder: "e.g. Amoxicillin" },
            { key: "brand_name", label: "Brand Name", placeholder: "e.g. Amoxil" },
            { key: "dosage_form", label: "Dosage Form", placeholder: "e.g. Capsule" },
          ]}
          columns={[
            { key: "generic_name", label: "Generic Name" },
            { key: "brand_name", label: "Brand Name" },
            { key: "dosage_form", label: "Dosage Form" },
          ]}
          emptyLabel="No drugs yet."
          addLabel="+ Add Drug"
          singular="drug"
        />
      )}
      {activeTab === "expense-categories" && (
        <SimpleCatalogSection
          key="expense-categories"
          endpoint="/clinic/managers/expense-categories/"
          fields={[{ key: "name", label: "Name", required: true, placeholder: "e.g. Rent" }]}
          columns={[{ key: "name", label: "Name" }]}
          emptyLabel="No expense categories yet."
          addLabel="+ Add Category"
          singular="expense category"
        />
      )}
    </PageShell>
  );
}

const emptyFormFor = (fields) =>
  fields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});

function SimpleCatalogSection({ endpoint, fields, columns, emptyLabel, addLabel, singular }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFormFor(fields));
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get(endpoint);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const visible = useMemo(
    () => items.filter((it) => showInactive || it.is_active),
    [items, showInactive]
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyFormFor(fields));
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    const next = {};
    fields.forEach((f) => {
      next[f.key] = item[f.key] ?? "";
    });
    setForm(next);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {};
      fields.forEach((f) => {
        const raw = form[f.key];
        if (f.type === "number") {
          payload[f.key] = raw === "" ? null : Number(raw);
        } else {
          payload[f.key] = raw === "" ? (f.required ? raw : null) : raw;
        }
      });
      if (editing) {
        await api.patch(`${endpoint}${editing.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function archiveItem(id) {
    try {
      await api.delete(`${endpoint}${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reactivateItem(item) {
    try {
      await api.patch(`${endpoint}${item.id}`, { is_active: true });
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
          {addLabel}
        </button>
      </div>

      {error && <p className="text-maroon-600 mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-saffron-200 overflow-hidden">
        {visible.length === 0 && !loading ? (
          <p className="p-6 text-sm text-maroon-400 text-center">{emptyLabel}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-parchment-100 text-maroon-600 text-left">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-5 py-3 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-100">
              {visible.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-parchment-50 ${!item.is_active ? "opacity-50" : ""}`}
                >
                  {columns.map((c, idx) => (
                    <td key={c.key} className="px-5 py-3 text-maroon-600">
                      {idx === 0 ? (
                        <>
                          <button
                            onClick={() => openEdit(item)}
                            className="text-maroon-800 font-medium hover:text-turquoise-600 text-left"
                          >
                            {item[c.key] || "—"}
                          </button>
                          {!item.is_active && (
                            <span className="ml-2 text-xs text-maroon-400">(archived)</span>
                          )}
                        </>
                      ) : c.money ? (
                        item[c.key] != null ? `$${Number(item[c.key]).toFixed(2)}` : "—"
                      ) : (
                        item[c.key] || "—"
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-right">
                    {item.is_active ? (
                      <button
                        onClick={() => archiveItem(item.id)}
                        className="text-xs border border-maroon-200 hover:border-maroon-400 text-maroon-600 rounded-lg px-3 py-1.5"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivateItem(item)}
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
        title={editing ? `Edit ${singular}` : `Add ${singular}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              required={f.required}
              type={f.type || "text"}
              value={form[f.key]}
              onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              placeholder={f.placeholder}
            />
          ))}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
