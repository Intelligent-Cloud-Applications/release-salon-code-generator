import React, { useEffect, useContext } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Context from "./development/Context/Context";
import Navbar from "./development/components/landing/Navbar";
import { SiteProvider } from "./development/components/context/SiteContext";
import Services from "./development/dashboard/Services";
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
import LandingHome from "./development/components/landing/LandingHome";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Home = () => <LandingHome />;

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

  const location = useLocation();

  return (
    <>
      {location.pathname === "/login" && (
        <SiteProvider>
          <Navbar />
          <div className="h-[60px] sm:h-[72px]" />
        </SiteProvider>
      )}
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutus" element={<Navigate to="/#about" replace />} />
        <Route path="/services" element={<Navigate to="/#services" replace />} />
        <Route path="/gallery" element={<Navigate to="/#gallery" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
        <Route path="/faq" element={<Navigate to="/#faq" replace />} />
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
      <Toaster />
    </>
  );
};

export default App;
