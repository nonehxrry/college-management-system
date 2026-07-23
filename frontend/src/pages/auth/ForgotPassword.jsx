import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authService } from "../../services/authService";
import toast from "react-hot-toast";

/* ─── Shared card wrapper ────────────────────────────────────────────────── */
const AuthCard = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-blue-700 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-xl shadow-primary-200 mb-4">
          🏛️
        </div>
        <h1 className="font-display font-bold text-gray-900 text-2xl">CMS Portal</h1>
        <p className="text-gray-400 text-sm mt-1">College Management System</p>
      </div>
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
        {children}
      </div>
    </div>
  </div>
);

/* ─── Password strength meter ────────────────────────────────────────────── */
const StrengthMeter = ({ password }) => {
  const checks = [
    { label: "At least 8 characters",  ok: password.length >= 8              },
    { label: "One uppercase letter",    ok: /[A-Z]/.test(password)            },
    { label: "One lowercase letter",    ok: /[a-z]/.test(password)            },
    { label: "One number",             ok: /[0-9]/.test(password)            },
    { label: "One special character",  ok: /[^A-Za-z0-9]/.test(password)    },
  ];
  const score = checks.filter((c) => c.ok).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][score];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-emerald-600",
  ][score];

  return (
    <div className="mt-3 space-y-3">
      {/* Strength bar */}
      {password.length > 0 && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Password strength</span>
            <span className={`text-xs font-semibold ${score >= 4 ? "text-emerald-600" : score >= 3 ? "text-amber-600" : "text-red-500"}`}>
              {strengthLabel}
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? strengthColor : "bg-gray-100"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Requirements checklist */}
      <div className="p-3.5 bg-gray-50 rounded-xl space-y-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <span className={`text-sm flex-shrink-0 transition-colors duration-200 ${c.ok ? "text-emerald-500" : "text-gray-300"}`}>
              {c.ok ? "✓" : "○"}
            </span>
            <span className={`text-xs transition-colors duration-200 ${c.ok ? "text-emerald-700" : "text-gray-400"}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────────────────── */
const ResetPassword = () => {
  const { token }    = useParams();            // /reset-password/:token
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    password:        "",
    confirmPassword: "",
  });
  const [showPass,   setShowPass]   = useState({ new: false, confirm: false });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(false);

  /* ── Validation ────────────────────────────────────────────────────────── */
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const isStrongEnough =
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[0-9]/.test(form.password);

  const canSubmit = isStrongEnough && passwordsMatch && !loading;

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please meet all password requirements and ensure passwords match.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await authService.resetPassword(token, form.password, form.confirmPassword);
      setSuccess(true);
      toast.success("Password reset successfully! Redirecting to login…");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes("expire") || msg?.toLowerCase().includes("invalid")) {
        setError("This reset link has expired or is invalid. Please request a new one.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ─────────────────────────────────────────────────────── */
  if (success) {
    return (
      <AuthCard>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-5xl mx-auto animate-bounce-soft">
            ✅
          </div>
          <div>
            <h2 className="font-display font-bold text-gray-900 text-xl">Password Reset!</h2>
            <p className="text-gray-500 text-sm mt-1">
              Your password has been updated successfully.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            Redirecting to Sign In…
          </div>
        </div>
      </AuthCard>
    );
  }

  /* ── Main form ─────────────────────────────────────────────────────────── */
  return (
    <AuthCard>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-gray-900 text-xl">Set a new password</h2>
        <p className="text-gray-500 text-sm mt-1">
          Choose a strong password to secure your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-red-700 text-sm font-medium">{error}</p>
              {error.includes("expired") && (
                <Link
                  to="/forgot-password"
                  className="text-xs text-red-600 underline underline-offset-2 mt-1 inline-block hover:text-red-700"
                >
                  Request a new reset link →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input
              type={showPass.new ? "text" : "password"}
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setError("");
              }}
              className="input-field pl-10 pr-12"
              placeholder="Enter new password"
              autoComplete="new-password"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => ({ ...p, new: !p.new }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
            >
              {showPass.new ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Strength meter — only shown when typing */}
          {form.password.length > 0 && <StrengthMeter password={form.password} />}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">Confirm New Password</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {form.confirmPassword.length > 0
                ? passwordsMatch ? "✅" : "❌"
                : "🔒"}
            </span>
            <input
              type={showPass.confirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value });
                setError("");
              }}
              className={`input-field pl-10 pr-12 ${
                form.confirmPassword.length > 0
                  ? passwordsMatch
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : "border-red-400 ring-2 ring-red-100"
                  : ""
              }`}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
            >
              {showPass.confirm ? "🙈" : "👁️"}
            </button>
          </div>
          {form.confirmPassword.length > 0 && !passwordsMatch && (
            <p className="error-text">Passwords do not match</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Passwords match</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Resetting password…
            </span>
          ) : (
            "🔒 Reset Password"
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-5 text-center">
        <Link
          to="/login"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          ← Back to Sign In
        </Link>
      </div>
    </AuthCard>
  );
};

export default ResetPassword;