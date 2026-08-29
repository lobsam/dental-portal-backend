import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CloudPatternBackground, EndlessKnot } from "../components/TibetanMotif";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
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
          <p className="font-tibetan text-saffron-200 text-lg mb-1">བོད་སྨན་ཁང་།</p>
          <h1 className="text-3xl font-semibold text-parchment-50">Norbu Dental Clinic</h1>
          <p className="text-maroon-200 text-sm mt-1">Staff &amp; clinic portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-parchment-50 rounded-2xl shadow-2xl p-8 border-2 border-saffron-400/40"
        >
          <h2 className="text-xl text-maroon-800 font-semibold mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 text-sm text-maroon-700 bg-maroon-50 border border-maroon-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-maroon-700 mb-1">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 rounded-lg border border-maroon-200 px-3 py-2 text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
            placeholder="you@clinic.com"
          />

          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-maroon-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-turquoise-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 rounded-lg border border-maroon-200 px-3 py-2 text-maroon-900 focus:outline-none focus:ring-2 focus:ring-turquoise-400"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-maroon-700 hover:bg-maroon-600 disabled:opacity-60 text-parchment-50 font-medium rounded-lg py-2.5 transition-colors"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-maroon-500 mt-5">
            New clinic?{" "}
            <Link to="/register" className="text-turquoise-600 font-medium hover:underline">
              Register your clinic
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
