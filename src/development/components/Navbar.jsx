import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogIn, Edit, Upload, Camera } from "lucide-react";

// --- Amplify v6 Imports ---
import { patch } from "aws-amplify/api";
import { uploadData, getUrl } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
const getConfig = Amplify.getConfig;
// --------------------------

import { toast } from "react-toastify";
import Context from "../Context/Context";

const Navbar = () => {
  const { institutionData, userData, setLoader, setInstitutionData } =
    useContext(Context);
  const { logoUrl, institutionid } = institutionData || {};
  const { userName, imgUrl } = userData || {};
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isCompanyNameModalOpen, setIsCompanyNameModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const location = useLocation();

  const isAdmin = userData?.userType === "admin";

  // Function to generate random pastel color
  const generatePastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = React.useMemo(() => {
    const items = [
      { name: "Home", path: "/" },
      { name: "About", path: "/aboutus" },
      { name: "Services", path: "/services" },
      { name: "Gallery", path: "/gallery" },
      { name: "Contact", path: "/contact" },
    ];
    if (!userName) {
      items.push({ name: "Login", path: "/login" });
    }
    return items;
  }, [userName]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isNotHome = location.pathname !== "/";
  const isNavbarTransparent = !(isScrolled || isNotHome);
  const hamburgerColor = isNavbarTransparent ? "white" : "black";
  const primaryColor = institutionData?.PrimaryColor || "#7cc143";

  // Initialize company name when institutionData changes
  useEffect(() => {
    if (institutionData?.companyName) {
      setNewCompanyName(institutionData.companyName);
    }
  }, [institutionData]);

  // --- Updated: Upload image to S3 (Amplify v6) ---
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `logos/${Date.now()}-${file.name}`;

      // 1. Upload Data
      // 'public' level in v5 maps to 'guest' accessLevel in v6
      const result = await uploadData({
        key: fileName,
        data: file,
        options: {
          accessLevel: "guest",
          contentType: file.type,
        },
      }).result;

      // 2. Construct Public URL
      const config = getConfig();
      const bucket = config.Storage?.S3?.bucket;
      const region = config.Storage?.S3?.region;

      if (bucket && region) {
        return `https://${bucket}.s3.${region}.amazonaws.com/public/${result.key}`;
      } else {
        // Fallback if config structure differs
        const urlOutput = await getUrl({
          key: result.key,
          options: { accessLevel: "guest", validateObjectExistence: false },
        });
        return urlOutput.url.toString();
      }
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      throw error;
    }
  };

  // Handle logo file selection
  const handleLogoFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Logo file size should be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // --- Updated: Handle company name save (Amplify v6 API) ---
  const handleCompanyNameSave = async () => {
    if (!newCompanyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      setLoader(true);
      const updatedData = { companyName: newCompanyName.trim() };

      await patch({
        apiName: "main",
        path: `/admin/${institutionid}/update-ui`,
        options: {
          body: { data: updatedData },
        },
      }).response;

      setInstitutionData((prev) => ({ ...prev, ...updatedData }));
      setIsCompanyNameModalOpen(false);
      toast.success("Company name updated successfully");
    } catch (error) {
      console.error("Error updating company name:", error);
      toast.error("Failed to update company name");
    } finally {
      setLoader(false);
    }
  };

  // --- Updated: Handle logo save (Amplify v6 API) ---
  const handleLogoSave = async () => {
    if (!logoFile) {
      toast.error("Please select a logo file");
      return;
    }

    try {
      setLoader(true);

      // Upload logo to S3
      const imageUrl = await uploadImageToS3(logoFile);

      if (imageUrl) {
        // Update institution data with new logo URL
        const updatedData = { logoUrl: imageUrl };

        await patch({
          apiName: "main",
          path: `/admin/${institutionid}/update-ui`,
          options: {
            body: { data: updatedData },
          },
        }).response;

        setInstitutionData((prev) => ({ ...prev, ...updatedData }));
        setIsLogoModalOpen(false);
        setLogoFile(null);
        setLogoPreview("");
        toast.success("Logo updated successfully");
      }
    } catch (error) {
      console.error("Error updating logo:", error);
      toast.error(`Failed to update logo: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  return (
    <motion.nav
      className={`fixed z-50 w-full transition-all duration-500 ${
        isScrolled || isNotHome
          ? "border-b border-gray-200/50 bg-white/95 shadow-xl backdrop-blur-md"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex flex-row items-center gap-3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            <div className="group relative">
              <RouterLink to="/">
                {institutionData?.logoUrl ? (
                  <motion.img
                    src={institutionData.logoUrl}
                    alt="LOGO"
                    className="h-14 transition-all duration-300"
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <motion.div
                  className={`flex h-14 w-14 items-center justify-center rounded-lg text-lg font-bold text-white shadow-lg transition-all duration-300 ${!institutionData?.logoUrl ? "flex" : "hidden"}`}
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 15px ${primaryColor}40`,
                  }}
                  whileHover={{
                    scale: 1.05,
                    rotate: 2,
                    boxShadow: `0 6px 20px ${primaryColor}60`,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {getInitials(institutionData?.companyName || "Logo")}
                </motion.div>
              </RouterLink>
              {/* Logo Edit Button */}
              {isAdmin && (
                <motion.button
                  onClick={() => setIsLogoModalOpen(true)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-all duration-300 hover:scale-110 group-hover:opacity-100"
                  style={{ border: `2px solid ${primaryColor}` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  whileHover={{
                    scale: 1.1,
                    backgroundColor: primaryColor,
                    color: "white",
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Camera size={12} />
                </motion.button>
              )}
            </div>

            <motion.div
              className="group relative flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.div
                className={`righteous-regular font-bold transition-all duration-300 md:text-2xl ${
                  isNotHome || isScrolled ? "text-black" : "text-white"
                }`}
                style={{
                  textShadow: isNavbarTransparent
                    ? "0 2px 10px rgba(0,0,0,0.3)"
                    : "none",
                }}
                whileHover={{ scale: 1.02 }}
              >
                {institutionData?.companyName || "Your Company Name"}
              </motion.div>

              {/* Company Name Edit Button */}
              {isAdmin && (
                <motion.button
                  onClick={() => setIsCompanyNameModalOpen(true)}
                  className={`ml-2 rounded-full p-1.5 opacity-0 transition-all duration-300 hover:scale-110 group-hover:opacity-100 ${
                    isNavbarTransparent
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit size={14} />
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Desktop Menu with User Info */}
          <motion.div
            className="hidden items-center space-x-8 lg:flex xl:space-x-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            {menuItems.map(({ name, path }, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                <RouterLink
                  to={path}
                  className={`group relative cursor-pointer text-base font-medium transition-all duration-300 xl:text-lg ${
                    location.pathname === path
                      ? "text-opacity-100"
                      : "hover:text-opacity-80"
                  }`}
                  style={{
                    color: isScrolled || isNotHome ? "black" : "white",
                    textShadow: isNavbarTransparent
                      ? "0 1px 3px rgba(0,0,0,0.3)"
                      : "none",
                  }}
                >
                  {name}
                  {/* Active indicator */}
                  {location.pathname === path && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                      layoutId="activeTab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  {/* Hover indicator */}
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full opacity-0 group-hover:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </RouterLink>
              </motion.div>
            ))}

            {/* User Info - Enhanced */}
            {userName && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
                className="flex items-center"
              >
                <RouterLink to="/dashboard/billing" className="">
                  <motion.div
                    className="relative flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {imgUrl ? (
                      <motion.img
                        src={imgUrl}
                        alt="User avatar"
                        className="h-10 w-10 rounded-full border-2 object-cover shadow-lg transition-all duration-300"
                        style={{
                          borderColor: isNavbarTransparent
                            ? "white"
                            : primaryColor,
                          boxShadow: `0 4px 15px ${isNavbarTransparent ? "rgba(255,255,255,0.3)" : primaryColor + "40"}`,
                        }}
                        whileHover={{
                          boxShadow: `0 6px 20px ${isNavbarTransparent ? "rgba(255,255,255,0.4)" : primaryColor + "60"}`,
                        }}
                      />
                    ) : (
                      <motion.div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium shadow-lg transition-all duration-300"
                        style={{
                          backgroundColor: generatePastelColor(),
                          border: `2px solid ${isNavbarTransparent ? "white" : primaryColor}`,
                          color: "white",
                          boxShadow: `0 4px 15px ${isNavbarTransparent ? "rgba(255,255,255,0.3)" : primaryColor + "40"}`,
                        }}
                        whileHover={{
                          boxShadow: `0 6px 20px ${isNavbarTransparent ? "rgba(255,255,255,0.4)" : primaryColor + "60"}`,
                        }}
                      >
                        {getInitials(userName)}
                      </motion.div>
                    )}
                    {/* Online indicator */}
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: "#10B981" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    />
                  </motion.div>
                </RouterLink>
              </motion.div>
            )}
          </motion.div>

          {/* Mobile Menu Icon */}
          <motion.div
            className="flex items-center lg:hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          >
            {/* Mobile User Info - Enhanced */}
            {userName && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
              >
                <RouterLink to="/dashboard/billing" className="mr-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {imgUrl ? (
                      <motion.img
                        src={imgUrl}
                        alt="User avatar"
                        className="h-8 w-8 rounded-full border-2 object-cover shadow-lg transition-all duration-300"
                        style={{
                          borderColor: isNavbarTransparent
                            ? "white"
                            : primaryColor,
                          boxShadow: `0 3px 10px ${isNavbarTransparent ? "rgba(255,255,255,0.3)" : primaryColor + "40"}`,
                        }}
                      />
                    ) : (
                      <motion.div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium shadow-lg transition-all duration-300"
                        style={{
                          backgroundColor: generatePastelColor(),
                          border: `2px solid ${isNavbarTransparent ? "white" : primaryColor}`,
                          color: "white",
                          boxShadow: `0 3px 10px ${isNavbarTransparent ? "rgba(255,255,255,0.3)" : primaryColor + "40"}`,
                        }}
                      >
                        {getInitials(userName)}
                      </motion.div>
                    )}
                    {/* Online indicator */}
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white"
                      style={{ backgroundColor: "#10B981" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring" }}
                    />
                  </motion.div>
                </RouterLink>
              </motion.div>
            )}

            {/* Enhanced Hamburger Menu */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative cursor-pointer rounded-full p-3 backdrop-blur-sm transition-all duration-300 focus:outline-none"
              style={{
                color: hamburgerColor,
                backgroundColor: isNavbarTransparent
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
                border: `1px solid ${isNavbarTransparent ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
              }}
              aria-label="Toggle menu"
              whileHover={{
                scale: 1.05,
                backgroundColor: isNavbarTransparent
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.1)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" color={hamburgerColor} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" color={hamburgerColor} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="border-t border-gray-200/50 bg-white/95 shadow-2xl backdrop-blur-md lg:hidden"
          >
            <motion.div
              className="space-y-2 px-6 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {menuItems.map(({ name, path }, index) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                >
                  <RouterLink
                    to={path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-300 ${
                      location.pathname === path
                        ? "bg-gray-100 text-gray-900 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {/* Icon for each menu item */}
                    <motion.div
                      className="flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-300"
                      style={{
                        backgroundColor:
                          location.pathname === path
                            ? primaryColor + "20"
                            : "transparent",
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {name === "Home" && <span className="text-lg">🏠</span>}
                      {name === "About" && <span className="text-lg">ℹ️</span>}
                      {name === "Services" && (
                        <span className="text-lg">✂️</span>
                      )}
                      {name === "Gallery" && (
                        <span className="text-lg">🖼️</span>
                      )}
                      {name === "Contact" && (
                        <span className="text-lg">📞</span>
                      )}
                      {name === "Login" && (
                        <LogIn size={16} style={{ color: primaryColor }} />
                      )}
                    </motion.div>

                    <span className="flex-1">{name}</span>

                    {/* Active indicator */}
                    {location.pathname === path && (
                      <motion.div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      />
                    )}
                  </RouterLink>
                </motion.div>
              ))}

              {/* Mobile user info section */}
              {userName && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mt-4 border-t border-gray-200 pt-4"
                >
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex h-6 w-6 items-center justify-center">
                      <User size={16} style={{ color: primaryColor }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Signed in as {userName}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company Name Edit Modal */}
      <AnimatePresence>
        {isCompanyNameModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsCompanyNameModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <motion.h2
                  className="text-2xl font-bold text-gray-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Edit Company Name
                </motion.h2>
                <motion.button
                  onClick={() => setIsCompanyNameModalOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-gray-500" />
                </motion.button>
              </div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter company name"
                    maxLength={50}
                  />
                </div>
              </motion.div>

              <motion.div
                className="mt-8 flex justify-end space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsCompanyNameModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCompanyNameSave}
                  className="rounded-xl px-6 py-3 font-medium text-white shadow-lg"
                  style={{
                    background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 4px 20px ${primaryColor}40`,
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: `0 6px 25px ${primaryColor}50`,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo Edit Modal */}
      <AnimatePresence>
        {isLogoModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsLogoModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <motion.h2
                  className="text-2xl font-bold text-gray-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Update Logo
                </motion.h2>
                <motion.button
                  onClick={() => {
                    setIsLogoModalOpen(false);
                    setLogoFile(null);
                    setLogoPreview("");
                  }}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-gray-500" />
                </motion.button>
              </div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Current Logo Preview */}
                <div className="text-center">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    Current Logo
                  </p>
                  <div className="flex justify-center">
                    {institutionData?.logoUrl ? (
                      <img
                        src={institutionData?.logoUrl}
                        alt="Current Logo"
                        className="h-16 w-auto rounded-lg object-contain shadow-md"
                      />
                    ) : (
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-lg font-bold text-white shadow-md"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {getInitials(institutionData?.companyName || "Logo")}
                      </div>
                    )}
                  </div>
                </div>

                {/* New Logo Upload */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Upload New Logo
                  </label>
                  <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    </label>
                  </div>
                </div>

                {/* Logo Preview */}
                {logoPreview && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      New Logo Preview
                    </p>
                    <div className="flex justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="h-16 w-auto rounded-lg object-contain shadow-md"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                className="mt-8 flex justify-end space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={() => {
                    setIsLogoModalOpen(false);
                    setLogoFile(null);
                    setLogoPreview("");
                  }}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleLogoSave}
                  disabled={!logoFile}
                  className="rounded-xl px-6 py-3 font-medium text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 4px 20px ${primaryColor}40`,
                  }}
                  whileHover={
                    logoFile
                      ? {
                          scale: 1.02,
                          boxShadow: `0 6px 25px ${primaryColor}50`,
                        }
                      : {}
                  }
                  whileTap={logoFile ? { scale: 0.98 } : {}}
                >
                  Update Logo
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default React.memo(Navbar);
