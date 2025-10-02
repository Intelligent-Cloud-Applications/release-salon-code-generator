import React, { useEffect, useContext } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Context from "./development/Context/Context";
import Hero from "./development/components/Hero";
import AboutUs from "./development/components/AboutUs";
import Service from "./development/components/Service";
import Services from "./development/dashboard/Services";
import Gallery from "./development/components/Gallery";
import Testimonial from "./development/components/Testimonial";
import Contact from "./development/components/Contact";
import Navbar from "./development/components/Navbar";
import Footer from "./development/components/Footer";
import FAQ from "./development/components/FAQ";
import Login from "./development/Auth/Login";
import Logout from "./development/Auth/Logout";
import Redirect from "./development/Auth/Login/Redirect";
import DashboardLayout from "./development/layouts/DashboardLayout";
import BillPreview from "./development/dashboard/BillPreview";
import NewDashboard from "./development/dashboard/NewDashboard";
import StaffsPage from "./development/dashboard/StaffsPage";
import ClientsPage from "./development/dashboard/ClientsPage";
import AppointmentsPage from "./development/dashboard/AppointmentsPage";
import BillingPage from "./development/dashboard/BillingPage";
import InventoryPage from "./development/dashboard/InventoryPage";
import ReportsPage from "./development/dashboard/ReportsPage";
import VendorManagementPage from "./development/dashboard/VendorManagementPage";
import ExpenseManagementPage from "./development/dashboard/ExpenseManagementPage";
import LoyaltyPointsPage from "./development/dashboard/LoyaltyPointsPage";
import { Toaster } from "./development/components/toaster";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Home = () => (
  <>
    <Hero />
    {/* <AboutUs />
    <Service />
    <Gallery />
    <Testimonial />
    <FAQ /> */}
  </>
);

const App = () => {
  const { institutionData } = useContext(Context);

  console.log("App component rendered");

  useEffect(() => {
    if (institutionData?.companyName) {
      document.title = institutionData.companyName;
    }

    const setFavicon = () => {
      const favicon = document.querySelector("link[rel='icon']");
      if (favicon && institutionData?.logoUrl) {
        favicon.href = institutionData.logoUrl;
      }
    };
    setFavicon();
  }, [institutionData]);

  // Check if the current route is dashboard, login, or logout to hide Footer
  const location = useLocation();
  const hideFooterRoutes = ["/dashboard", "/login", "/logout", "/redirect" , "/", "/bill"];
  const shouldHideFooter = hideFooterRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  return (
    <>
      {(location.pathname === "/" ||
        location.pathname === "/aboutus" ||
        location.pathname === "/services" ||
        location.pathname === "/gallery" ||
        location.pathname === "/contact" ||
        location.pathname === "/login") && <Navbar />}
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/services" element={<Service />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        {/* Standalone bill preview route (outside dashboard) */}
        <Route path="/bill/preview/:id" element={<BillPreview />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<NewDashboard />} />
          <Route path="/dashboard/staffs" element={<StaffsPage />} />
          <Route path="/dashboard/clients" element={<ClientsPage />} />
          <Route path="/dashboard/appointments" element={<AppointmentsPage />} />
          <Route path="/dashboard/billing" element={<BillingPage />} />
          <Route path="/dashboard/billing/preview/:id" element={<BillPreview />} />
          <Route path="/dashboard/service" element={<Services />} />
          <Route path="/dashboard/inventory" element={<InventoryPage />} />
          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route path="/dashboard/vendor-management" element={<VendorManagementPage />} />
          <Route path="/dashboard/expense-management" element={<ExpenseManagementPage />} />
          <Route path="/dashboard/loyalty-points" element={<LoyaltyPointsPage />} />
        </Route>
        <Route path="/redirect" element={<Redirect />} />
      </Routes>
      {!shouldHideFooter && <Footer />}
      <Toaster />
    </>
  );
};

export default App;
