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
import metaTagsData from "./operation/metatags.json";

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

const verifyMetaTags = () => {
  const metaTags = {
    title: document.querySelector('meta[name="title"]')?.content,
    description: document.querySelector('meta[name="description"]')?.content,
    keywords: document.querySelector('meta[name="keywords"]')?.content,
    documentTitle: document.title,
  };

  console.log("Current Meta Tags:", metaTags);

  return metaTags;
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const App = () => {
  const { institutionData, loader } = useContext(Context);

  console.log("App component rendered");

  useEffect(() => {
    if (institutionData?.companyName) {
      document.title = `Welcome to ${capitalizeFirstLetter(institutionData.companyName)}`;
    }
    const logoUrl = institutionData?.logoUrl;
    const setFavicon = () => {
      if (!logoUrl) return;
      let link =
        document.querySelector("link[rel*='icon']") ||
        document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = logoUrl;
      document.head.appendChild(link);
    };
    setFavicon();
  }, [institutionData]);

  const metaTitle =
    metaTagsData?.seo?.title ||
    `Welcome to ${capitalizeFirstLetter(institutionData?.companyName || "Our Salon")}`;
  const metaDescription =
    metaTagsData?.seo?.description || "Best salon services in town.";
  const metaKeywords =
    metaTagsData?.seo?.keywords?.join(", ") || "salon, beauty, hair, spa";
  const gtmId = metaTagsData?.gtmId || "GTM-XXXXXXX";

  // Meta tags management
  useEffect(() => {
    const updateOrCreateMetaTag = (name, content) => {
      let tag = document.querySelector(`meta[name='${name}']`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    updateOrCreateMetaTag("title", metaTitle);
    updateOrCreateMetaTag("description", metaDescription);
    updateOrCreateMetaTag("keywords", metaKeywords);

    setTimeout(() => {
      verifyMetaTags();
    }, 1000);
  }, [metaTitle, metaDescription, metaKeywords]);

  // Google Tag Manager Integration
  useEffect(() => {
    if (!gtmId) return;
    const existingScript = document.querySelector(
      'script[src*="googletagmanager"]',
    );
    if (existingScript) existingScript.remove();
    const script = document.createElement("script");
    script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
    document.head.appendChild(script);
    const noscript = document.createElement("noscript");
    noscript.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe>
      `;
    document.body.appendChild(noscript);
  }, [gtmId]);

  // Check if the current route is dashboard, login, or logout to hide Footer
  const location = useLocation();
  const hideFooterRoutes = [
    "/dashboard",
    "/login",
    "/logout",
    "/redirect",
    "/",
    "/bill",
  ];
  const shouldHideFooter = hideFooterRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  return (
    <>
      {(
        (location.pathname === "/" ||
          location.pathname === "/aboutus" ||
          location.pathname === "/services" ||
          location.pathname === "/gallery" ||
          location.pathname === "/contact" ||
          location.pathname === "/login") && <Navbar />
      )}
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
          <Route
            path="/dashboard/appointments"
            element={<AppointmentsPage />}
          />
          <Route path="/dashboard/billing" element={<BillingPage />} />
          <Route
            path="/dashboard/billing/preview/:id"
            element={<BillPreview />}
          />
          <Route path="/dashboard/service" element={<Services />} />
          <Route path="/dashboard/inventory" element={<InventoryPage />} />
          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route
            path="/dashboard/vendor-management"
            element={<VendorManagementPage />}
          />
          <Route
            path="/dashboard/expense-management"
            element={<ExpenseManagementPage />}
          />
          <Route
            path="/dashboard/loyalty-points"
            element={<LoyaltyPointsPage />}
          />
        </Route>
        <Route path="/redirect" element={<Redirect />} />
      </Routes>
      {!shouldHideFooter && <Footer />}
      <Toaster />
    </>
  );
};

export default App;