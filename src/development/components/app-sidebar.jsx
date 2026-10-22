import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Calendar,
  CreditCard,
  Package,
  BarChart3,
  Truck,
  Gift,
  Scissors,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  UserCheck,
  Scale,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import Context from "@/development/Context/Context";

const sidebarMenuItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    iconColor: "text-blue-400",
  },
  {
    to: "/dashboard/appointments",
    label: "Appointments",
    icon: Calendar,
    iconColor: "text-sky-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/appointments", label: "Appointments List" },
      { to: "/dashboard/appointments?tab=today", label: "Today's Schedule" },
      { to: "/dashboard/appointments?tab=new", label: "Book Appointment" },
    ],
  },
  {
    to: "/dashboard/billing",
    label: "Billing & POS",
    icon: CreditCard,
    iconColor: "text-emerald-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/billing", label: "POS Billing Register" },
      { to: "/dashboard/billing?tab=history", label: "Invoices & Receipts" },
      { to: "/dashboard/billing?tab=daily", label: "Daily Cash Register" },
    ],
  },
  {
    to: "/dashboard/clients",
    label: "Clients",
    icon: UserCheck,
    iconColor: "text-indigo-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/clients", label: "Client Directory" },
      { to: "/dashboard/clients?tab=new", label: "Add New Client" },
      { to: "/dashboard/loyalty-points", label: "Loyalty Points" },
    ],
  },
  {
    to: "/dashboard/service",
    label: "Services Menu",
    icon: Scissors,
    iconColor: "text-rose-400",
    hasSubmenu: true,
    defaultExpanded: true,
    submenus: [
      { to: "/dashboard/service", label: "All Services" },
      { to: "/dashboard/service?category=Hair", label: "Hair & Styling" },
      { to: "/dashboard/service?category=Spa", label: "Hair Spa & Botox" },
      { to: "/dashboard/service?category=Skin", label: "Skin & Facials" },
      { to: "/dashboard/service?category=Grooming", label: "Beard Grooming" },
    ],
  },
  {
    to: "/dashboard/staffs",
    label: "Staff & Stylists",
    icon: Users,
    iconColor: "text-violet-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/staffs", label: "Staff List" },
      { to: "/dashboard/staffs?tab=schedule", label: "Stylist Schedule" },
      { to: "/dashboard/staffs?tab=attendance", label: "Stylist Attendance" },
    ],
  },
  {
    to: "/dashboard/expense-management",
    label: "Accounts & Expenses",
    icon: Scale,
    iconColor: "text-amber-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/expense-management", label: "Expenses Tracker" },
      { to: "/dashboard/expense-management?tab=daily", label: "Daily Expenses" },
      { to: "/dashboard/vendor-management", label: "Supplier Orders" },
    ],
  },
  {
    to: "/dashboard/inventory",
    label: "Inventory & Retail",
    icon: Package,
    iconColor: "text-teal-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/inventory", label: "Products Catalog" },
      { to: "/dashboard/inventory?tab=alerts", label: "Low Stock Alerts" },
      { to: "/dashboard/inventory?tab=usage", label: "In-House Consumption" },
    ],
  },
  {
    to: "/dashboard/vendor-management",
    label: "Vendors & Suppliers",
    icon: Truck,
    iconColor: "text-yellow-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/vendor-management", label: "Vendor Directory" },
      { to: "/dashboard/vendor-management?tab=orders", label: "Purchase Orders" },
    ],
  },
  {
    to: "/dashboard/reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    iconColor: "text-cyan-400",
    hasSubmenu: true,
    submenus: [
      { to: "/dashboard/reports", label: "Salon P&L & MIS" },
      { to: "/dashboard/reports?tab=services", label: "Service Analytics" },
      { to: "/dashboard/reports?tab=stylists", label: "Stylist Performance" },
    ],
  },
  {
    to: "/dashboard/loyalty-points",
    label: "Loyalty Program",
    icon: Gift,
    iconColor: "text-rose-400",
  },
  {
    to: "/dashboard/service",
    label: "Settings",
    icon: Settings,
    iconColor: "text-slate-400",
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

  // Track expanded state for menu accordions
  const [expandedMenus, setExpandedMenus] = useState({
    "Services Menu": true,
  });

  const toggleSubmenu = (menuLabel) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuLabel]: !prev[menuLabel],
    }));
  };

  // Auto-expand menu if current route matches one of its submenus
  useEffect(() => {
    sidebarMenuItems.forEach((item) => {
      if (item.hasSubmenu && item.submenus) {
        const matches = item.submenus.some(
          (sub) => sub.to.split("?")[0] === location.pathname
        );
        if (matches) {
          setExpandedMenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [location.pathname]);

  const handleNavClick = () => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const displayName = institutionData?.companyName || "Tekkzy Hair Salon";
  const userInitials = userData?.name
    ? userData.name.substring(0, 2).toUpperCase()
    : displayName.substring(0, 2).toUpperCase() || "TH";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Professional Dark Charcoal & Cobalt Blue Sidebar Container */}
      <aside
        className={clsx(
          "h-screen bg-[#0f172a] flex flex-col transition-all duration-300 select-none border-r border-[#1e293b] z-50",
          "fixed inset-y-0 left-0 lg:static lg:translate-x-0 shadow-2xl lg:shadow-none",
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[72px]" : "lg:w-60 xl:w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={clsx(
            "h-16 flex items-center border-b border-[#1e293b] bg-[#0b1120] shrink-0 transition-all",
            isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {isCollapsed && !isMobileOpen ? (
            /* Collapsed Brand Icon */
            <button
              onClick={() => setIsCollapsed && setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer group relative"
              title="Click to expand sidebar"
            >
              {institutionData?.logoUrl ? (
                <img
                  src={institutionData.logoUrl}
                  alt={displayName}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <div className="w-full h-full rounded bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                  <Scissors className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                  {institutionData?.logoUrl ? (
                    <img
                      src={institutionData.logoUrl}
                      alt={displayName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                      <Scissors className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-white font-bold text-sm tracking-tight truncate leading-tight">
                    {displayName}
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate leading-tight mt-0.5">
                    {institutionData?.tagline || "Salon Management"}
                  </p>
                </div>
              </div>

              {/* Desktop collapse toggle */}
              <button
                onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav
          className={clsx(
            "flex-1 overflow-y-auto py-2.5 space-y-1 custom-scrollbar",
            isCollapsed && !isMobileOpen ? "px-2" : "px-3"
          )}
        >
          {sidebarMenuItems.map((item, idx) => {
            const isDashboard = item.label === "Dashboard";
            const isDashboardActive = isDashboard && location.pathname === "/dashboard";
            const isSubmenuMatched =
              item.hasSubmenu &&
              item.submenus?.some(
                (sub) => sub.to.split("?")[0] === location.pathname
              );
            const isOtherActive =
              !isDashboard &&
              location.pathname !== "/dashboard" &&
              (location.pathname.startsWith(item.to) || isSubmenuMatched);
            const isActive = isDashboardActive || isOtherActive;
            const isMenuExpanded = !!expandedMenus[item.label];
            const IconComponent = item.icon;
            const isCollapsedView = isCollapsed && !isMobileOpen;

            return (
              <div key={`${item.label}-${idx}`} className="space-y-0.5 relative">
                {/* Main Item Row */}
                {item.hasSubmenu && item.submenus?.length ? (
                  <div
                    onClick={() => {
                      if (isCollapsedView) {
                        setIsCollapsed && setIsCollapsed(false);
                      }
                      toggleSubmenu(item.label);
                    }}
                    className={clsx(
                      "flex items-center rounded-xl text-xs font-medium cursor-pointer transition-all select-none relative group",
                      isCollapsedView
                        ? "w-11 h-10 mx-auto justify-center"
                        : "gap-3 px-3 py-2.5 w-full",
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    )}
                  >
                    {/* Icon */}
                    <IconComponent
                      className={clsx(
                        "w-[18px] h-[18px] shrink-0 transition-colors",
                        isActive ? "text-white" : item.iconColor
                      )}
                    />

                    {!isCollapsedView ? (
                      <>
                        <span className="flex-1 truncate tracking-wide">
                          {item.label}
                        </span>
                        {/* Chevron */}
                        {isMenuExpanded ? (
                          <ChevronDown className={clsx("w-3.5 h-3.5", isActive ? "text-white/80" : "text-slate-400")} />
                        ) : (
                          <ChevronRight className={clsx("w-3.5 h-3.5", isActive ? "text-white/80" : "text-slate-500")} />
                        )}
                      </>
                    ) : (
                      /* Floating Flyout Submenu when collapsed */
                      <div className="absolute left-[calc(100%+8px)] top-0 hidden group-hover:block bg-[#0b1120] border border-[#1e293b] rounded-xl shadow-2xl py-2 px-1.5 min-w-44 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1e293b] mb-1.5 flex items-center justify-between">
                          <span>{item.label}</span>
                        </div>
                        <div className="space-y-0.5">
                          {item.submenus.map((sub) => (
                            <Link
                              key={sub.label}
                              to={sub.to}
                              onClick={handleNavClick}
                              className="block px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors truncate"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.to}
                    onClick={handleNavClick}
                    className={clsx(
                      "flex items-center rounded-xl text-xs font-medium transition-all select-none relative group",
                      isCollapsedView
                        ? "w-11 h-10 mx-auto justify-center"
                        : "gap-3 px-3 py-2.5 w-full",
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    )}
                  >
                    <IconComponent
                      className={clsx(
                        "w-[18px] h-[18px] shrink-0 transition-colors",
                        isActive ? "text-white" : item.iconColor
                      )}
                    />

                    {!isCollapsedView ? (
                      <span className="flex-1 truncate tracking-wide">
                        {item.label}
                      </span>
                    ) : (
                      /* Floating Tooltip when collapsed */
                      <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 px-2.5 py-1.5 bg-[#0b1120] border border-[#1e293b] text-white text-xs font-medium rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <span>{item.label}</span>
                      </div>
                    )}
                  </Link>
                )}

                {/* Submenu Accordion: Clean Professional Indigo Indicator Line */}
                {item.hasSubmenu && isMenuExpanded && !isCollapsedView && (
                  <div className="relative ml-5 pl-3 border-l-2 border-blue-500/70 space-y-0.5 my-1 transition-all">
                    {item.submenus?.map((sub) => {
                      const currentUrl = location.pathname + location.search;
                      const hasQueryInSub = sub.to.includes("?");
                      const isSubActive = hasQueryInSub
                        ? currentUrl === sub.to
                        : location.pathname === sub.to && !location.search;
                      return (
                        <Link
                          key={sub.label}
                          to={sub.to}
                          onClick={handleNavClick}
                          className={clsx(
                            "block py-1.5 px-3 text-xs rounded-lg transition-colors truncate",
                            isSubActive
                              ? "text-white bg-slate-800 font-semibold"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Profile */}
        <div className="p-3 border-t border-[#1e293b] bg-[#0b1120] shrink-0">
          {!isCollapsed || isMobileOpen ? (
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {userData?.name || displayName}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {userData?.role || "Salon Administrator"}
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400 shrink-0" />
            </div>
          ) : (
            <div
              className="flex justify-center relative group cursor-pointer"
              title={userData?.name || displayName}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs relative">
                {userInitials}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b1120]" />
              </div>
              {/* Floating tooltip for profile in collapsed mode */}
              <div className="absolute left-[calc(100%+8px)] bottom-0 hidden group-hover:block bg-[#0b1120] border border-[#1e293b] rounded-xl shadow-2xl p-2.5 min-w-36 z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                <div className="text-xs font-bold text-white">{userData?.name || displayName}</div>
                <div className="text-[10px] text-slate-400">{userData?.role || "Salon Administrator"}</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
export { Sidebar as AppSidebar };