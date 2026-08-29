import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { CloudPatternBackground, EndlessKnot } from "../components/TibetanMotif";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res?.message || "If an account with that email exists, a reset link has been sent.");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-maroon-800 flex items-center justify-center px-4 overflow-hidden">
      <CloudPatternBackground className="absolute inset-0 text-saffron-200/10" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <EndlessKnot className="w-14 h-14 mx-auto text-saffron-300 mb-3" />
          <h1 className="text-3xl font-semibold text-parchment-50">Reset your password</h1>
          <p className="text-maroon-200 text-sm mt-1">
            We&apos;ll email you a link to choose a new one.
          </p>
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

          {message ? (
            <div className="text-sm text-maroon-700 bg-turquoise-50 border border-turquoise-200 rounded-lg px-3 py-3 mb-2">
              {message}
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-maroon-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mb-6 rounded-lg border border-maroon-200 px-3 py-2 text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
                placeholder="you@clinic.com"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5 transition-colors"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </>
          )}

          <p className="text-center text-sm text-maroon-500 mt-5">
            <Link to="/login" className="text-turquoise-600 font-medium hover:underline">
              ← Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
