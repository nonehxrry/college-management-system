import { useState, useEffect } from "react";
import { useNavigate, Link }  from "react-router-dom";
import { useAuth }            from "../../context/AuthContext";
import { ROLES }              from "../../utils/constants";

const ROLE_CONFIG = {
  student: {
    label:       "Student",
    emoji:       "🎓",
    gradient:    "from-sky-600 to-blue-700",
    ring:        "ring-sky-400",
    demoEmail:   "student@college.edu",
    demoPass:    "Student@123",
    description: "Access your attendance, results, assignments & more",
  },
  professor: {
    label:       "Professor",
    emoji:       "👨‍🏫",
    gradient:    "from-emerald-600 to-teal-700",
    ring:        "ring-emerald-400",
    demoEmail:   "professor@college.edu",
    demoPass:    "Prof@123",
    description: "Mark attendance, upload marks & manage assignments",
  },
  admin: {
    label:       "Admin",
    emoji:       "⚙️",
    gradient:    "from-violet-600 to-purple-700",
    ring:        "ring-violet-400",
    demoEmail:   "admin@college.edu",
    demoPass:    "Admin@123456",
    description: "Full system control — users, results, settings",
  },
};

const STATS = [
  { value: "2,400+", label: "Students"   },
  { value: "120+",   label: "Professors" },
  { value: "8",      label: "Departments"},
  { value: "99.9%",  label: "Uptime"     },
];

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [role,       setRole]       = useState("student");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const conf = ROLE_CONFIG[role];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
    // Pre-fill demo credentials for that role
    setEmail(ROLE_CONFIG[newRole].demoEmail);
    setPassword(ROLE_CONFIG[newRole].demoPass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password, role);
      navigate(`/${data.user.role}/dashboard`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (hidden on mobile) ─────────────────────────────────── */}
      <div className={`hidden lg:flex flex-col w-[420px] flex-shrink-0 bg-gradient-to-br ${conf.gradient} text-white p-10 relative overflow-hidden transition-all duration-500`}>
        {/* Background decoration */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-10 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl backdrop-blur">
              🏛️
            </div>
            <div>
              <p className="font-display font-bold text-lg leading-tight">CMS Portal</p>
              <p className="text-white/60 text-xs">College Management System</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-6xl mb-6">{conf.emoji}</div>
            <h2 className="font-display font-bold text-3xl leading-tight mb-3">{conf.label} Portal</h2>
            <p className="text-white/70 text-sm leading-relaxed">{conf.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <p className="font-display font-bold text-2xl text-white">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${conf.gradient} flex items-center justify-center text-2xl shadow-lg`}>
              🏛️
            </div>
            <p className="font-display font-bold text-gray-900 text-xl">CMS Portal</p>
          </div>

          <h1 className="font-display font-bold text-gray-900 text-2xl mb-1">Welcome back!</h1>
          <p className="text-gray-500 text-sm mb-7">Sign in to continue to your portal</p>

          {/* Role switcher */}
          <div className="flex gap-2 mb-6 p-1.5 bg-gray-200 rounded-2xl">
            {Object.entries(ROLE_CONFIG).map(([key, rc]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleRoleChange(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200
                  ${role === key
                    ? `bg-white text-gray-900 shadow-md ring-2 ${rc.ring}`
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <span>{rc.emoji}</span>
                <span className="hidden sm:inline">{rc.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@college.edu"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-xl font-bold text-white text-sm transition-all duration-200
                bg-gradient-to-r ${conf.gradient} shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                `Sign in as ${conf.label} ${conf.emoji}`
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Demo Credentials ({conf.label})
            </p>
            <div className="space-y-1">
              <div className="flex gap-2">
                <span className="text-xs text-gray-400 w-16">Email:</span>
                <code className="text-xs text-gray-700 font-mono">{conf.demoEmail}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-gray-400 w-16">Password:</span>
                <code className="text-xs text-gray-700 font-mono">{conf.demoPass}</code>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setEmail(conf.demoEmail); setPassword(conf.demoPass); }}
              className="mt-2 text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Auto-fill →
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Secured by JWT · Encrypted · HTTPS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;