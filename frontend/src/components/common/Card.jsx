const Card = ({ children, className = "", onClick, hover = false, padding = "p-6" }) => (
  <div
    className={`bg-white rounded-2xl shadow-card ${hover ? "hover:shadow-card-hover transition-shadow duration-300" : ""} ${padding} ${onClick ? "cursor-pointer" : ""} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const StatCard = ({
  label,
  value,
  icon,
  change,
  changeType = "neutral",
  color = "blue",
  loading = false,
  subtitle,
  onClick,
}) => {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
  };

  const c = colors[color] || colors.blue;
  const changeColors = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-gray-500 bg-gray-50",
  };

  return (
    <Card hover onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {loading ? (
            <>
              <div className="h-8 w-20 rounded-lg shimmer mb-2" />
              <div className="h-4 w-28 rounded-lg shimmer" />
            </>
          ) : (
            <>
              <p className={`stat-number ${c.text}`}>{value}</p>
              <p className="stat-label mt-1">{label}</p>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </>
          )}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {change && !loading && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${changeColors[changeType]}`}>
            {changeType === "up" ? "↑" : changeType === "down" ? "↓" : "→"} {change}
          </span>
        </div>
      )}
    </Card>
  );
};

export const GlassCard = ({ children, className = "", gradient = "from-primary-600 to-primary-700" }) => (
  <div className={`rounded-2xl bg-gradient-to-br ${gradient} text-white p-6 shadow-lg ${className}`}>
    {children}
  </div>
);

export const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-2.5">
      {icon && <span className="text-base">{icon}</span>}
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-800">{value || "—"}</span>
  </div>
);

export default Card;