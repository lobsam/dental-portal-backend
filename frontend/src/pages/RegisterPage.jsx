import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CloudPatternBackground, EndlessKnot } from "../components/TibetanMotif";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  clinic_name: "",
  contact_number: "",
  country: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to register.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-maroon-800 flex items-center justify-center px-4 py-10 overflow-hidden">
      <CloudPatternBackground className="absolute inset-0 text-saffron-200/10" />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-6">
          <EndlessKnot className="w-12 h-12 mx-auto text-saffron-300 mb-2" />
          <h1 className="text-2xl font-semibold text-parchment-50">Register your clinic</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-parchment-50 rounded-2xl shadow-2xl p-8 border-2 border-saffron-400/40"
        >
          {error && (
            <div className="mb-4 text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" value={form.first_name} onChange={update("first_name")} required />
            <Field label="Last name" value={form.last_name} onChange={update("last_name")} required />
          </div>

          <Field
            label="Email address"
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            className="mt-4"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            minLength={8}
            className="mt-4"
          />

          <hr className="my-5 border-saffron-200" />

          <Field
            label="Clinic name"
            value={form.clinic_name}
            onChange={update("clinic_name")}
            required
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="Contact number" value={form.contact_number} onChange={update("contact_number")} />
            <Field label="Country" value={form.country} onChange={update("country")} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5 transition-colors"
          >
            {submitting ? "Creating clinic…" : "Create My Account"}
          </button>

          <p className="text-center text-sm text-maroon-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-turquoise-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-maroon-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-maroon-200 px-3 py-2 text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
      />
    </div>
  );
}
