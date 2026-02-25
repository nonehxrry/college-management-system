import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { PageLoader } from "./components/common/LoadingSpinner";
import ForcedPopup from "./components/common/ForcedPopup";
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import "./App.css";

/* ─── Auth pages ──────────────────────────────────────────────────────────── */
import Login          from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword  from "./pages/auth/ResetPassword";

/* ─── Student pages ──────────────────────────────────────────────────────── */
import StudentDashboard   from "./pages/student/Dashboard";
import StudentAttendance  from "./pages/student/Attendance";
import StudentAssignments from "./pages/student/Assignments";
import StudentResults     from "./pages/student/Results";
import StudentDateSheet   from "./pages/student/DateSheet";
import StudentNotices     from "./pages/student/Notices";
import StudentProfile     from "./pages/student/Profile";
import StudentTickets     from "./pages/student/Tickets";

/* ─── Professor pages ────────────────────────────────────────────────────── */
import ProfessorDashboard     from "./pages/professor/Dashboard";
import ProfessorAttendance    from "./pages/professor/Attendance";
import ProfessorAssignments   from "./pages/professor/Assignments";
import ProfessorResults       from "./pages/professor/Results";
import ProfessorStudyMaterial from "./pages/professor/StudyMaterial";
import ProfessorAnalytics     from "./pages/professor/Analytics";

/* ─── Admin pages ────────────────────────────────────────────────────────── */
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers     from "./pages/admin/Users";
import AdminAcademics from "./pages/admin/Academics";
import AdminResults   from "./pages/admin/Results";
import AdminNotices   from "./pages/admin/Notices";
import AdminDateSheet from "./pages/admin/DateSheet";
import AdminFees      from "./pages/admin/Fees";
import AdminSettings  from "./pages/admin/Settings";

// ─── Helper: update <title> without react-helmet-async ───────────────────────
const PageTitle = ({ title }) => {
  useEffect(() => {
    document.title = title ? `${title} | CMS Portal` : "CMS Portal";
  }, [title]);
  return null;
};

// ─── 1. Redirect unauthenticated users to /login ─────────────────────────────
const RequireAuth = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};

// ─── 2. Restrict by role ──────────────────────────────────────────────────────
const RequireRole = ({ role }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user || user.role !== role) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// ─── 3. Redirect already-authenticated users away from /login ─────────────────
const RequireGuest = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated && user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Outlet />;
};

// ─── Nav items per role ────────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = {
  student: [
    { path: "/student/dashboard",   icon: "🏠", label: "Dashboard"   },
    { path: "/student/attendance",  icon: "📅", label: "Attendance"  },
    { path: "/student/assignments", icon: "📋", label: "Assignments" },
    { path: "/student/results",     icon: "📊", label: "Results"     },
    { path: "/student/date-sheet",  icon: "📆", label: "Date Sheet"  },
    { path: "/student/notices",     icon: "📢", label: "Notices"     },
    { path: "/student/profile",     icon: "👤", label: "Profile"     },
    { path: "/student/tickets",     icon: "🎫", label: "Support"     },
  ],
  professor: [
    { path: "/professor/dashboard",      icon: "🏠", label: "Dashboard"      },
    { path: "/professor/attendance",     icon: "📅", label: "Attendance"     },
    { path: "/professor/assignments",    icon: "📋", label: "Assignments"    },
    { path: "/professor/results",        icon: "📊", label: "Upload Marks"   },
    { path: "/professor/study-material", icon: "📚", label: "Study Material" },
    { path: "/professor/analytics",      icon: "📈", label: "Analytics"      },
  ],
  admin: [
    { path: "/admin/dashboard",  icon: "🏠", label: "Dashboard"  },
    { path: "/admin/users",      icon: "👥", label: "Users"      },
    { path: "/admin/academics",  icon: "🎓", label: "Academics"  },
    { path: "/admin/results",    icon: "📊", label: "Results"    },
    { path: "/admin/notices",    icon: "📢", label: "Notices"    },
    { path: "/admin/date-sheet", icon: "📆", label: "Date Sheet" },
    { path: "/admin/fees",       icon: "💰", label: "Fees"       },
    { path: "/admin/settings",   icon: "⚙️",  label: "Settings"   },
  ],
};

// ─── 4. App shell — Navbar + Sidebar + content ──────────────────────────────────────────────
const AppShell = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = NAV_ITEMS[role] || [];
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ForcedPopup />
      <Sidebar navItems={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar role={role} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16">
          <div className="max-w-screen-xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  );
};
// ─── 5. 404 page ──────────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 p-6 text-center">
    <PageTitle title="404 — Not Found" />
    <div className="text-8xl">🔍</div>
    <div>
      <h1 className="font-display font-bold text-gray-900 text-3xl mb-2">Page not found</h1>
      <p className="text-gray-500 text-base max-w-md">
        The page you're looking for doesn't exist or you don't have permission to view it.
      </p>
    </div>
    <button onClick={() => window.history.back()} className="btn-primary text-sm py-3 px-6">
      ← Go Back
    </button>
  </div>
);

// ─── 6. Root redirect ─────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated && user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Navigate to="/login" replace />;
};

// ─── 7. Full route tree ───────────────────────────────────────────────────────
const App = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />

    {/* ── Public / Guest ───────────────────────────────────────────────── */}
    <Route element={<RequireGuest />}>
      <Route path="/login"                element={<><PageTitle title="Sign In" /><Login /></>} />
      <Route path="/forgot-password"      element={<><PageTitle title="Forgot Password" /><ForgotPassword /></>} />
      <Route path="/reset-password/:token" element={<><PageTitle title="Reset Password" /><ResetPassword /></>} />
    </Route>

    {/* ── Authenticated ────────────────────────────────────────────────── */}
    <Route element={<RequireAuth />}>

      {/* STUDENT */}
      <Route element={<RequireRole role="student" />}>
        <Route element={<AppShell role="student" />}>
          <Route path="/student/dashboard"   element={<><PageTitle title="Dashboard" /><StudentDashboard /></>} />
          <Route path="/student/attendance"  element={<><PageTitle title="Attendance" /><StudentAttendance /></>} />
          <Route path="/student/assignments" element={<><PageTitle title="Assignments" /><StudentAssignments /></>} />
          <Route path="/student/results"     element={<><PageTitle title="Results" /><StudentResults /></>} />
          <Route path="/student/date-sheet"  element={<><PageTitle title="Date Sheet" /><StudentDateSheet /></>} />
          <Route path="/student/notices"     element={<><PageTitle title="Notices" /><StudentNotices /></>} />
          <Route path="/student/profile"     element={<><PageTitle title="My Profile" /><StudentProfile /></>} />
          <Route path="/student/tickets"     element={<><PageTitle title="Support" /><StudentTickets /></>} />
          <Route path="/student/*"           element={<Navigate to="/student/dashboard" replace />} />
        </Route>
      </Route>

      {/* PROFESSOR */}
      <Route element={<RequireRole role="professor" />}>
        <Route element={<AppShell role="professor" />}>
          <Route path="/professor/dashboard"      element={<><PageTitle title="Dashboard" /><ProfessorDashboard /></>} />
          <Route path="/professor/attendance"     element={<><PageTitle title="Mark Attendance" /><ProfessorAttendance /></>} />
          <Route path="/professor/assignments"    element={<><PageTitle title="Assignments" /><ProfessorAssignments /></>} />
          <Route path="/professor/results"        element={<><PageTitle title="Upload Marks" /><ProfessorResults /></>} />
          <Route path="/professor/study-material" element={<><PageTitle title="Study Material" /><ProfessorStudyMaterial /></>} />
          <Route path="/professor/analytics"      element={<><PageTitle title="Analytics" /><ProfessorAnalytics /></>} />
          <Route path="/professor/*"              element={<Navigate to="/professor/dashboard" replace />} />
        </Route>
      </Route>

      {/* ADMIN */}
      <Route element={<RequireRole role="admin" />}>
        <Route element={<AppShell role="admin" />}>
          <Route path="/admin/dashboard"  element={<><PageTitle title="Dashboard" /><AdminDashboard /></>} />
          <Route path="/admin/users"      element={<><PageTitle title="User Management" /><AdminUsers /></>} />
          <Route path="/admin/academics"  element={<><PageTitle title="Academics" /><AdminAcademics /></>} />
          <Route path="/admin/results"    element={<><PageTitle title="Results" /><AdminResults /></>} />
          <Route path="/admin/notices"    element={<><PageTitle title="Notices" /><AdminNotices /></>} />
          <Route path="/admin/date-sheet" element={<><PageTitle title="Date Sheet" /><AdminDateSheet /></>} />
          <Route path="/admin/fees"       element={<><PageTitle title="Fee Management" /><AdminFees /></>} />
          <Route path="/admin/settings"   element={<><PageTitle title="Settings" /><AdminSettings /></>} />
          <Route path="/admin/*"          element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;