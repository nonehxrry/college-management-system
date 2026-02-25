import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../../context/AuthContext";
import { getInitials, generateAvatarColor } from "../../utils/helpers";

const Navbar = ({ onMenuClick, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarColor = generateAvatarColor(user?.name || "");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const roleConfig = {
    student: { label: "Student Portal", emoji: "🎓" },
    professor: { label: "Professor Portal", emoji: "👨‍🏫" },
    admin: { label: "Admin Panel", emoji: "⚙️" },
  };

  const config = roleConfig[user?.role] || roleConfig.student;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          {title ? (
            <>
              <h2 className="font-display font-bold text-gray-900 text-sm leading-tight">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400">{config.label}</p>
              <h2 className="font-display font-bold text-gray-900 text-sm">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                {user?.name?.split(" ")[0]} {config.emoji}
              </h2>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className={`w-8 h-8 ${avatarColor} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                {getInitials(user?.name)}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name?.split(" ")[0]}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium capitalize">
                    {user?.role}
                  </span>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { navigate(`/${user?.role}/profile`); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>👤</span> My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;