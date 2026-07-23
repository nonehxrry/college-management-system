import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getInitials, generateAvatarColor } from "../../utils/helpers";

const themeMap = {
  student: {
    gradient: "from-[#0f172a] via-[#1e3a5f] to-[#0f172a]",
    accent: "text-sky-300",
    activeBg: "bg-sky-500/20",
    activeText: "text-sky-100",
    dot: "bg-sky-400",
    label: "STUDENT",
    roleLabel: "Student Portal",
    logo: "🎓",
  },
  professor: {
    gradient: "from-[#064e3b] via-[#065f46] to-[#064e3b]",
    accent: "text-emerald-300",
    activeBg: "bg-emerald-500/20",
    activeText: "text-emerald-100",
    dot: "bg-emerald-400",
    label: "PROFESSOR",
    roleLabel: "Faculty Portal",
    logo: "👨‍🏫",
  },
  admin: {
    gradient: "from-[#1a0533] via-[#2d1257] to-[#1a0533]",
    accent: "text-violet-300",
    activeBg: "bg-violet-500/20",
    activeText: "text-violet-100",
    dot: "bg-violet-400",
    label: "ADMIN",
    roleLabel: "Administration",
    logo: "⚙️",
  },
};

const Sidebar = ({ navItems, isOpen, onClose }) => {
  const { user, profile, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const theme = themeMap[user?.role] || themeMap.student;
  const avatarColor = generateAvatarColor(user?.name || "");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-gradient-to-b ${theme.gradient}
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl shadow-inner">
              {theme.logo}
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-sm tracking-tight">CMS Portal</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? theme.dot : "bg-red-400"} ${isConnected ? "animate-pulse" : ""}`} />
                <span className={`text-[10px] font-medium ${theme.accent}`}>
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/20" />
            ) : (
              <div className={`w-10 h-10 ${avatarColor} rounded-xl flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20`}>
                {getInitials(user?.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight truncate">{user?.name}</p>
              <p className={`text-xs ${theme.accent} truncate`}>
                {user?.role === "student" ? profile?.rollNumber : profile?.employeeId || user?.email?.split("@")[0]}
              </p>
            </div>
          </div>

          {user?.role === "student" && profile && (
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              {[
                { label: "Sem", value: profile.semester },
                { label: "CGPA", value: profile.cgpa?.toFixed(1) || "—" },
                { label: "Sec", value: profile.section },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/8 rounded-lg p-2 text-center">
                  <p className="text-white font-bold text-xs font-display">{value}</p>
                  <p className={`text-[10px] ${theme.accent}`}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {user?.role === "professor" && profile && (
            <div className="mt-2 px-1">
              <p className={`text-xs ${theme.accent} truncate`}>{profile.designation}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 overflow-y-auto no-scrollbar">
          <p className={`text-[10px] font-bold ${theme.accent} uppercase tracking-widest px-3 mb-3 mt-1`}>
            {theme.label}
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ path, icon, label, badge }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative
                  ${isActive
                    ? `${theme.activeBg} ${theme.activeText} shadow-sm`
                    : "text-gray-300 hover:bg-white/8 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-current rounded-r-full opacity-80" />
                    )}
                    <span className="text-lg leading-none">{icon}</span>
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300/80 hover:bg-red-500/15 hover:text-red-200 transition-all duration-150"
          >
            <span className="text-lg">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;