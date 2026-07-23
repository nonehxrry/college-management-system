const sizes = {
  sm: { outer: "w-6 h-6",  inner: "w-4 h-4",  border: "border-2" },
  md: { outer: "w-10 h-10",inner: "w-7 h-7",  border: "border-2" },
  lg: { outer: "w-16 h-16",inner: "w-11 h-11",border: "border-[3px]" },
  xl: { outer: "w-24 h-24",inner: "w-16 h-16",border: "border-4" },
};

const LoadingSpinner = ({
  size       = "md",
  fullScreen = false,
  text,
  color      = "primary",
}) => {
  const s = sizes[size] || sizes.md;

  const colorMap = {
    primary: "border-primary-600",
    white:   "border-white",
    gray:    "border-gray-400",
  };
  const ringColor = colorMap[color] || colorMap.primary;

  const spinner = (
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <div
        className={`${s.outer} ${s.border} rounded-full border-gray-200`}
      />
      {/* Spinning arc */}
      <div
        className={`absolute ${s.inner} ${s.border} rounded-full ${ringColor} border-t-transparent animate-spin`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4">
        {spinner}
        {text && <p className="text-sm text-gray-500 font-medium animate-pulse">{text}</p>}
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        {spinner}
        <p className="text-sm text-gray-400 font-medium">{text}</p>
      </div>
    );
  }

  return spinner;
};

export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
    <div className="w-16 h-16 relative">
      <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
      <div className="absolute inset-0 w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="text-sm text-gray-400 animate-pulse font-medium">Loading…</p>
  </div>
);

export const InlineLoader = ({ text = "Loading…" }) => (
  <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
    <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export default LoadingSpinner;