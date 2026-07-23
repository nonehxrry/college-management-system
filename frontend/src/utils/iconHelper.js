import * as Icons from "lucide-react";

/**
 * Maps icon names to lucide-react components
 * Usage: const IconComponent = getIconComponent("Home");
 *        return <IconComponent size={20} />;
 */
export const getIconComponent = (iconName) => {
  const iconMap = {
    // Navigation
    Home: Icons.Home,
    Dashboard: Icons.LayoutDashboard,
    Calendar: Icons.Calendar,
    ClipboardList: Icons.ClipboardList,
    BarChart3: Icons.BarChart3,
    CalendarDays: Icons.CalendarDays,
    Bell: Icons.Bell,
    User: Icons.User,
    Headphones: Icons.Headphones,
    BookOpen: Icons.BookOpen,
    TrendingUp: Icons.TrendingUp,
    Users: Icons.Users,
    GraduationCap: Icons.GraduationCap,
    BookMarked: Icons.BookMarked,
    Brain: Icons.Brain,
    CreditCard: Icons.CreditCard,
    Settings: Icons.Settings,
    LogOut: Icons.LogOut,
    
    // Actions
    Plus: Icons.Plus,
    Edit: Icons.Edit,
    Trash: Icons.Trash2,
    Download: Icons.Download,
    Upload: Icons.Upload,
    Eye: Icons.Eye,
    EyeOff: Icons.EyeOff,
    Search: Icons.Search,
    Filter: Icons.Filter,
    Sort: Icons.ArrowUpDown,
    
    // Status
    CheckCircle: Icons.CheckCircle,
    AlertCircle: Icons.AlertCircle,
    XCircle: Icons.XCircle,
    Info: Icons.Info,
    HelpCircle: Icons.HelpCircle,
    
    // Other
    Menu: Icons.Menu,
    X: Icons.X,
    ChevronDown: Icons.ChevronDown,
    ChevronUp: Icons.ChevronUp,
    ArrowRight: Icons.ArrowRight,
    ArrowLeft: Icons.ArrowLeft,
  };
  
  return iconMap[iconName] || Icons.HelpCircle;
};

/**
 * Quick icon render function for simple cases
 * Usage: <>{renderIcon("Home", 20)}</>
 */
export const renderIcon = (iconName, size = 20, className = "") => {
  const IconComponent = getIconComponent(iconName);
  return <IconComponent size={size} className={className} />;
};

/**
 * Icon mapping for status indicators
 */
export const getStatusIcon = (status) => {
  const statusIconMap = {
    success: "CheckCircle",
    error: "XCircle",
    warning: "AlertCircle",
    info: "Info",
    default: "HelpCircle",
  };
  return statusIconMap[status] || statusIconMap.default;
};

/**
 * Color mapping for status badges
 */
export const getStatusColor = (status) => {
  const statusColorMap = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };
  return statusColorMap[status] || statusColorMap.default;
};
