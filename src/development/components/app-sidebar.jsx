import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Calendar,
  CreditCard,
  Package,
  BarChart3,
  Truck,
  Scissors,
  ChevronRight,
  ChevronLeft,
  X,
  UserCheck,
  Scale,
  Clock,
  TrendingUp,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import Context from "@/development/Context/Context";

const sidebarMenuItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    to: "/dashboard/appointments",
    label: "Appointments",
    icon: Calendar,
  },
  {
    to: "/dashboard/billing",
    label: "Billing & POS",
    icon: CreditCard,
  },
  {
    to: "/dashboard/order-history",
    label: "Order History",
    icon: Clock,
  },
  {
    to: "/dashboard/revenue",
    label: "Revenue",
    icon: TrendingUp,
  },
  {
    to: "/dashboard/clients",
    label: "Clients",
    icon: Users,
  },
  {
    to: "/dashboard/service",
    label: "Services",
    icon: Scissors,
  },
  {
    to: "/dashboard/staffs",
    label: "Staff & Stylists",
    icon: UserCheck,
  },
  {
    to: "/dashboard/inventory",
    label: "Inventory",
    icon: Package,
  },
  {
    to: "/dashboard/expense-management",
    label: "Expenses",
    icon: Scale,
  },
  {
    to: "/dashboard/vendor-management",
    label: "Vendors",
    icon: Truck,
  },
  {
    to: "/dashboard/reports",
    label: "Reports & Analytics",
    icon: BarChart3,
  },
  {
    to: "/dashboard/settings",
    label: "Settings & Printer",
    icon: Settings,
  },
];

export function Sidebar({
  isCollapsed = false,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) {
  const location = useLocation();
  const { institutionData, userData } = useContext(Context);

  const handleNavClick = () => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleToggleCollapse = () => {
    if (setIsCollapsed) {
      const next = !isCollapsed;
      setIsCollapsed(next);
      try {
        localStorage.setItem("salon_sidebar_collapsed", String(next));
      } catch (e) {}
    }
  };

  const displayName = institutionData?.companyName || "Tekkzy Hair Salon";
  const userInitials = userData?.name
    ? userData.name.substring(0, 2).toUpperCase()
    : displayName.substring(0, 2).toUpperCase() || "TH";

  const isCollapsedView = isCollapsed && !isMobileOpen;

  return (
    <>
      {/* Mobile Backdrop Overlay with smooth fade */}
      <div
        onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
        className={clsx(
          "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300",
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      />

      {/* Modern, Clean & Simple Sidebar Container with ultra-smooth width & slide animation */}
      <aside
        className={clsx(
          "h-screen bg-[#0f172a] flex flex-col select-none border-r border-[#1e293b] z-50 overflow-hidden",
          "transition-[width,transform] duration-300 ease-in-out",
          "fixed inset-y-0 left-0 lg:static lg:translate-x-0 shadow-2xl lg:shadow-none",
          isMobileOpen
            ? "translate-x-0 w-64 sm:w-72"
            : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[72px]" : "lg:w-60 xl:w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={clsx(
            "h-16 flex items-center border-b border-[#1e293b] bg-[#0b1120] shrink-0 px-3.5 transition-all duration-300",
            isCollapsedView ? "justify-center" : "justify-between"
          )}
        >
          {/* Logo container */}
          <button
            onClick={isCollapsedView ? handleToggleCollapse : undefined}
            className={clsx(
              "w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group relative",
              isCollapsedView
                ? "cursor-pointer hover:ring-2 hover:ring-blue-500/50"
                : "cursor-default"
            )}
            title={isCollapsedView ? "Click to expand sidebar" : displayName}
          >
            {institutionData?.logoUrl ? (
              <img
                src={institutionData.logoUrl}
                alt={displayName}
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <div className="w-full h-full rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                <Scissors className="w-4 h-4 text-blue-600" />
              </div>
            )}
            {/* Expansion hint on hover when collapsed */}
            {isCollapsedView && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                <ChevronRight className="w-3 h-3" />
              </div>
            )}
          </button>

          {/* Brand Name & Tagline: Smoothly collapses/expands */}
          <div
            className={clsx(
              "min-w-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              isCollapsedView
                ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                : "opacity-100 flex-1 ml-3 max-w-[150px] xl:max-w-[170px]"
            )}
          >
            <h1 className="text-white font-semibold text-sm tracking-tight truncate leading-tight">
              {displayName}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate leading-tight mt-0.5">
              {institutionData?.tagline || "Salon Management"}
            </p>
          </div>

          {/* Desktop collapse toggle button */}
          <button
            onClick={handleToggleCollapse}
            className={clsx(
              "hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 shrink-0 cursor-pointer",
              isCollapsedView
                ? "opacity-0 max-w-0 p-0 pointer-events-none"
                : "opacity-100"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean, Simple Single-Level Navigation List */}
        <nav
          className={clsx(
            "flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar transition-all duration-300",
            isCollapsedView ? "px-2" : "px-3"
          )}
        >
          {sidebarMenuItems.map((item) => {
            const isDashboard = item.to === "/dashboard";
            const isActive = isDashboard
              ? location.pathname === "/dashboard"
              : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const IconComponent = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={clsx(
                  "group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 select-none overflow-hidden",
                  isCollapsedView
                    ? "w-11 h-10 mx-auto justify-center px-0"
                    : "px-3.5 py-2.5 w-full",
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                )}
              >
                <IconComponent
                  className={clsx(
                    "w-[18px] h-[18px] shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />

                {/* Text Label: smoothly slides & fades */}
                <span
                  className={clsx(
                    "whitespace-nowrap transition-all duration-300 ease-in-out truncate tracking-wide",
                    isCollapsedView
                      ? "opacity-0 max-w-0 ml-0 overflow-hidden pointer-events-none"
                      : "opacity-100 max-w-[180px] ml-3"
                  )}
                >
                  {item.label}
                </span>

                {/* Floating Tooltip when collapsed */}
                {isCollapsedView && (
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1.5 bg-[#0b1120] text-slate-100 text-xs font-medium rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none animate-in fade-in-50 zoom-in-95 duration-150">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Clean Footer Profile */}
       
      </aside>
    </>
  );
}

export default Sidebar;
export { Sidebar as AppSidebar };
