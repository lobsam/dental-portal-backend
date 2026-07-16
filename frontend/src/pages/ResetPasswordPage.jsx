import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { CloudPatternBackground, EndlessKnot } from "../components/TibetanMotif";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "This reset link is invalid or has expired.");
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
          <h1 className="text-3xl font-semibold text-parchment-50">Choose a new password</h1>
        </div>

        <div className="bg-parchment-50 rounded-2xl shadow-2xl p-8 border-2 border-saffron-400/40">
          {!token && (
            <div className="text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-3">
              This link is missing its reset token. Please use the link from your email, or{" "}
              <Link to="/forgot-password" className="text-turquoise-600 font-medium hover:underline">
                request a new one
              </Link>
              .
            </div>
          )}

          {token && success && (
            <div className="text-sm text-maroon-700 bg-turquoise-50 border border-turquoise-200 rounded-lg px-3 py-3">
              Your password has been reset. Redirecting you to sign in…
            </div>
          )}

          {token && !success && (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <label className="block text-sm font-medium text-maroon-700 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mb-4 rounded-lg border border-maroon-200 px-3 py-2 text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
                placeholder="At least 8 characters"
              />

              <label className="block text-sm font-medium text-maroon-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mb-6 rounded-lg border border-maroon-200 px-3 py-2 text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
                placeholder="Re-enter new password"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5 transition-colors"
              >
                {submitting ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-maroon-500 mt-5">
            <Link to="/login" className="text-turquoise-600 font-medium hover:underline">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
