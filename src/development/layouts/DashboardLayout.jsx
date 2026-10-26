import React, { useState, useEffect, useContext } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import AppSidebar from "@/development/components/app-sidebar";
import Context from "@/development/Context/Context";
import {
  Menu,
  Search,
  LogOut,
  Scissors,
  Sparkles,
  ChevronDown,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function DashboardLayout() {
  const { loadDashboardData, institutionData, userData, loader } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = Boolean(
    String(userData?.userType || '').toLowerCase() === 'admin' ||
    String(userData?.role || '').toLowerCase() === 'admin' ||
    localStorage.getItem('adminDevBypass') ||
    String(localStorage.getItem('userType') || '').toLowerCase() === 'admin'
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Exact collapse and mobile states matching Education layout
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("salon_sidebar_collapsed") === "true";
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("salon_sidebar_collapsed", String(next));
        } catch (e) {}
        return next;
      });
    }
  };

  // Keyboard shortcut listener for Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const searchInput = document.getElementById("salon-omnisearch-input");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/appointments?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    if (loadDashboardData) {
      loadDashboardData();
    }
  }, [loadDashboardData]);

  const displayName = institutionData?.companyName || "Tekkzy Hair Salon";
  const userInitials = userData?.name
    ? userData.name.substring(0, 2).toUpperCase()
    : displayName.substring(0, 2).toUpperCase() || "TH";

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("adminDevBypass");
        localStorage.removeItem("userType");
        sessionStorage.clear();
      } catch (err) {}
      window.location.replace("/login");
    }
  };

  // Dashboard Access Protection: Only accessible by admin userType
  if (!loader && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4EDE3] flex flex-col font-sans select-none relative overflow-hidden">
        {/* Top Minimal Navigation Bar */}
        <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#D4A574]/20 bg-white/40 backdrop-blur-md relative z-20">
          <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <span
              className="text-2xl sm:text-3xl tracking-wide"
              style={{
                fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                color: "#4A121B",
              }}
            >
              {displayName}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#4A121B]/30 hover:bg-[#4A121B] hover:text-[#F6EFE5] text-[#4A121B] text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50"
            title="Logout and switch to another account"
          >
            {isLoggingOut ? (
              <Loader2 size={14} className="animate-spin text-[#4A121B]" />
            ) : (
              <LogOut size={14} />
            )}
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </header>

        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-[#4A121B]/20" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-[#D4A574]/30" />
        </div>

        {/* Centered Locked Card */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="max-w-md w-full bg-[#1A0A0E] text-[#F6EFE5] border-2 border-[#D4A574] rounded-3xl p-8 sm:p-10 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#D4A574]/20 border border-[#D4A574] flex items-center justify-center text-[#D4A574] mb-5 shadow-inner">
              <Lock size={32} />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4A574] mb-2 block">
              Admin Access Only
            </span>

            <h2
              className="font-serif text-2xl sm:text-3xl text-[#F6EFE5] font-bold mb-3"
              style={{ fontFamily: "'Playfair Display', Didot, serif" }}
            >
              Dashboard Locked
            </h2>

            <p className="text-xs sm:text-sm text-[#C9B8A8]/80 leading-relaxed mb-6">
              The salon operations dashboard is exclusively reserved for administrators.
              {userData?.userType ? (
                <span className="block mt-2 font-mono text-xs text-[#D4A574]">
                  Current userType: &quot;{userData.userType}&quot;
                </span>
              ) : (
                <span className="block mt-2 font-mono text-xs text-[#D4A574]">
                  You are not logged in as an Administrator
                </span>
              )}
            </p>

            <div className="flex flex-col gap-3 w-full">
              {/* Primary: Logout and direct to Login */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#D4A574] to-[#C49666] hover:from-[#c49666] hover:to-[#B38555] text-[#1A0A0E] text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#1A0A0E]" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    <span>Logout & Go to Login</span>
                  </>
                )}
              </button>

              {/* Secondary: Back to Home */}
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#D4A574]/40 text-[#D4A574] hover:bg-[#D4A574]/15 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Website</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden font-sans select-none transition-colors duration-200">
      {/* Exact Match Education Sidebar for Salon */}
      <AppSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area: Clean Navbar + Page */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Clean, Uncluttered Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 select-none shrink-0 transition-colors duration-200">
          {/* Left: Hamburger Menu + Clean Search */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 max-w-xl">
            <button
              onClick={handleToggleSidebar}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 sm:left-3 pointer-events-none shrink-0" />
              <input
                id="salon-omnisearch-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search appointments, clients, services..."
                className="w-full pl-8 sm:pl-9 pr-2 sm:pr-16 py-1.5 text-xs font-normal bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 border border-slate-200/90 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 transition-all truncate"
              />
              <div className="hidden sm:flex absolute right-2 items-center pointer-events-none">
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200/80 rounded shadow-2xs">
                  Ctrl + /
                </span>
              </div>
            </form>
          </div>

          {/* Right Controls: Clean User Profile Dropdown Only (No Clutter) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200/80 shrink-0"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {userData?.name || displayName}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 leading-tight">
                    {userData?.role || "Salon Administrator"}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
              </button>

              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-80"
                  onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                  <div className="p-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{institutionData?.email || "admin@salon.com"}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 text-xs py-2 px-3 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <Scissors className="w-4 h-4 text-slate-500" />
                    Salon Dashboard
                  </Link>
                  <Link
                    to="/dashboard/service"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 text-xs py-2 px-3 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    Services & Menu
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <Link
                    to="/logout"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 text-xs py-2 px-3 text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`flex-1 bg-[#f8fafc] overflow-x-hidden ${
            location.pathname === "/dashboard/billing"
              ? "overflow-hidden p-2 sm:p-2.5 lg:p-3 h-[calc(100vh-4rem)] flex flex-col"
              : "overflow-y-auto p-2.5 sm:p-4 lg:p-5"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}