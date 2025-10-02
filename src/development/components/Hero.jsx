import React, { useState, useRef, useContext, useEffect } from "react";
import {
  FaFacebookF,
  FaWhatsapp,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Context from "../Context/Context";
import { API } from "aws-amplify";
import { toast } from "react-toastify";
import { Edit, X, Sparkles } from "lucide-react";
import Loader from "./Loader";

const SocialIcon = ({ href, children, primaryColor, delay = 0 }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-lg"
    style={{
      backgroundColor: `${primaryColor}88`,
      boxShadow: `0 4px 20px ${primaryColor}40`,
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
    whileHover={{
      scale: 1.1,
      backgroundColor: primaryColor,
      boxShadow: `0 8px 30px ${primaryColor}60`,
    }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.a>
);

const Hero = () => {
  const { institutionData, userData, setLoader, setInstitutionData } =
    useContext(Context);
  const navigate = useNavigate();
  const [bubbles, setBubbles] = useState([]);
  const institutionId = institutionData?.institutionid;
  const primaryColor = institutionData?.PrimaryColor || "#D4AF37";
  const isAdmin = userData?.userType === "admin";

  const [isTaglineModalOpen, setIsTaglineModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [tagLine1, setTagLine1] = useState("");
  const [tagLine2, setTagLine2] = useState("");
  const [productTagline, setProductTagline] = useState("");
  const [socialLinks, setSocialLinks] = useState(() => {
    const linksArray = institutionData.socialMediaLinks || [];

    const linksObject = linksArray.reduce(
      (acc, item) => {
        let platform = item.platform.toLowerCase();

        // normalize names
        if (platform === "youtubeLink") platform = "youtube";
        if (platform === "yt") platform = "youtube";

        acc[platform] = item.url;
        return acc;
      },
      {
        facebook: "",
        whatsapp: "",
        instagram: "",
        youtube: "",
      },
    );

    // Also fallback if separate youtubeLink field exists
    if (institutionData.youtubeLink) {
      linksObject.youtube = institutionData.youtubeLink;
    }
    console.log("Initialized socialLinks:", linksObject);

    return linksObject;
  });

  useEffect(() => {
    if (institutionData) {
      setTagLine1(institutionData.tagLine1 || "");
      setTagLine2(institutionData.tagLine2 || "");
      setProductTagline(institutionData.productTagline || "");
      const initialLinks = Array.isArray(institutionData?.socialMediaLinks)
        ? institutionData.socialMediaLinks.reduce((acc, link) => {
            acc[link.platform.toLowerCase()] = link.url;
            return acc;
          }, {})
        : { facebook: "", twitter: "", instagram: "" };
      setSocialLinks(initialLinks);
    }
  }, [institutionData]);

  useEffect(() => {
    const createBubble = () => {
      setBubbles((prev) => [
        ...prev,
        {
          id: Math.random(),
          size: Math.random() * 12 + 4,
          left: Math.random() * 100,
          duration: Math.random() * 8 + 12,
        },
      ]);
      setTimeout(() => {
        setBubbles((prev) => prev.slice(1));
      }, 20000);
    };

    const interval = setInterval(createBubble, 80);
    for (let i = 0; i < 15; i++) {
      setTimeout(() => createBubble(), i * 50);
    }

    return () => clearInterval(interval);
  }, []);

  if (!institutionData?.heroImage) return <Loader />;

  const openTaglineModal = () => setIsTaglineModalOpen(true);
  const openSocialModal = () => setIsSocialModalOpen(true);

  const handleTaglineSave = async () => {
    if (!tagLine1.trim() || !tagLine2.trim() || !productTagline.trim()) {
      toast.error("All tagline fields are required.");
      return;
    }

    try {
      setLoader(true);
      const updatedData = { tagLine1, tagLine2, productTagline };
      await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: updatedData },
      });

      setInstitutionData((prev) => ({ ...prev, ...updatedData }));
      setIsTaglineModalOpen(false);
      toast.success("Taglines updated successfully.");
    } catch {
      toast.error("Failed to update taglines.");
    } finally {
      setLoader(false);
    }
  };

  const handleSocialSave = async () => {
    const updatedSocialLinks = [
      { platform: "facebook", url: socialLinks.facebook },
      { platform: "whatsapp", url: socialLinks.whatsapp },
      { platform: "instagram", url: socialLinks.instagram },
      { platform: "youtube", url: socialLinks.youtube },
    ].filter((link) => link.url && link.url.trim());

    try {
      setLoader(true);
      const updatedData = { socialMediaLinks: updatedSocialLinks };
      await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: updatedData },
      });

      setInstitutionData((prev) => ({
        ...prev,
        socialMediaLinks: updatedSocialLinks,
      }));
      setIsSocialModalOpen(false);
      toast.success("Social media links updated.");
    } catch {
      toast.error("Failed to update social media links.");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black max800:pt-32">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${institutionData.heroBg || ""})` }}
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/30" />

      {/* Animated Bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        {bubbles.map((bubble, index) => (
          <motion.div
            key={bubble.id}
            className="absolute bottom-0 rounded-full backdrop-blur-sm"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.left}vw`,
              background: `linear-gradient(45deg, ${primaryColor}30, white20)`,
              boxShadow: `0 0 ${bubble.size}px ${primaryColor}20`,
            }}
            initial={{ y: 100, opacity: 0 }}
            animate={{
              y: -window.innerHeight - 100,
              opacity: [0, 0.8, 0.6, 0],
            }}
            transition={{
              duration: bubble.duration,
              ease: "linear",
              opacity: { duration: bubble.duration * 0.8 },
            }}
          />
        ))}
      </div>

      {/* Floating Sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <Sparkles
            size={16 + (i % 3) * 4}
            color={primaryColor}
            className="opacity-60"
          />
        </motion.div>
      ))}

      {/* Social Media Sidebar */}
      <motion.div
        className="fixed left-8 top-0 z-30 hidden h-screen flex-col items-center justify-center space-y-6 min800:flex"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="h-16 w-[2px] rounded-full bg-gradient-to-b from-transparent via-current to-transparent"
          style={{ color: primaryColor }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        />
        <SocialIcon
          href={socialLinks.facebook || "#"}
          primaryColor={primaryColor}
          delay={1.4}
        >
          <FaFacebookF size={18} />
        </SocialIcon>
        <SocialIcon
          href={socialLinks.whatsapp || "#"}
          primaryColor={primaryColor}
          delay={1.6}
        >
          <FaWhatsapp size={18} />
        </SocialIcon>
        <SocialIcon
          href={socialLinks.instagram || "#"}
          primaryColor={primaryColor}
          delay={1.8}
        >
          <FaInstagram size={18} />
        </SocialIcon>

        <SocialIcon
          href={socialLinks.youtube || "#"}
          primaryColor={primaryColor}
        >
          <FaYoutube size={18} />
        </SocialIcon>

        {isAdmin && (
          <motion.button
            onClick={openSocialModal}
            className="rounded-full border border-white/20 p-2 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 2,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit size={16} />
          </motion.button>
        )}
        <motion.div
          className="h-16 w-[2px] rounded-full bg-gradient-to-b from-current via-transparent to-transparent"
          style={{ color: primaryColor }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        />
      </motion.div>

      <div className="relative flex h-full flex-col items-center justify-center min1050:flex-row min1050:justify-start">
        {/* Main Content */}
        <motion.div
          className="relative z-20 flex h-full w-full flex-col items-center justify-center px-8 pt-20 text-center min800:pt-32 min1050:w-[45%] min1050:items-start min1050:pl-32 min1050:pt-0 min1050:text-left"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Animated Title */}
          <motion.h1
            className="mb-6 text-5xl font-bold leading-tight text-white xl:text-8xl min800:text-6xl min1050:mb-8 min1050:text-7xl"
            style={{
              WebkitTextStroke: "2px white",
              WebkitTextFillColor: "transparent",
              textShadow: `0 0 20px ${primaryColor}40`,
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          >
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {tagLine1 || "Smart Haircut"}
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              {tagLine2 || "For Men"}
            </motion.span>
          </motion.h1>

          {/* Animated Subtitle */}
          <motion.p
            className="mb-8 max-w-xl text-base leading-relaxed text-white/90 backdrop-blur-sm min800:text-lg min1050:mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            {productTagline || "Premium Grooming Services for Modern Men"}
          </motion.p>

          {/* Animated CTA Button */}
          <motion.button
            onClick={() => navigate("/contact")}
            className="group relative mb-8 overflow-hidden rounded-full px-8 py-4 text-base font-semibold text-white"
            style={{
              background: `linear-gradient(45deg, ${primaryColor}, ${primaryColor}dd)`,
              boxShadow: `0 10px 30px ${primaryColor}40`,
            }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 1.1,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: `0 15px 40px ${primaryColor}60`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">Contact Us</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>

          {/* Mobile Social Icons */}
          <motion.div
            className="mb-6 flex space-x-4 min800:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
          >
            <SocialIcon
              href={socialLinks.facebook || "#"}
              primaryColor={primaryColor}
              delay={1.4}
            >
              <FaFacebookF size={18} />
            </SocialIcon>
            <SocialIcon
              href={socialLinks.whatsapp || "#"}
              primaryColor={primaryColor}
              delay={1.6}
            >
              <FaWhatsapp size={18} />
            </SocialIcon>
            <SocialIcon
              href={socialLinks.instagram || "#"}
              primaryColor={primaryColor}
              delay={1.6}
            >
              <FaInstagram size={18} />
            </SocialIcon>
          </motion.div>

          {/* Admin Edit Button */}
          {isAdmin && (
            <motion.button
              onClick={openTaglineModal}
              className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
              style={{ backgroundColor: `${primaryColor}40` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.6, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit size={20} />
              <span>Edit Content</span>
            </motion.button>
          )}
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="order-2 flex w-full justify-center min1050:absolute min1050:right-0 min1050:h-full min1050:w-auto min1050:justify-end"
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
        >
          <motion.img
            src={institutionData.heroImage}
            alt="Hero"
            className="h-[300px] w-auto rounded-lg object-cover min1050:h-full min1050:rounded-none"
            style={{
              objectPosition: "center right",
              filter: "drop-shadow(0 0 30px rgba(0,0,0,0.5))",
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>

      {/* Tagline Modal */}
      <AnimatePresence>
        {isTaglineModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsTaglineModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
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
                  Edit Taglines
                </motion.h2>
                <motion.button
                  onClick={() => setIsTaglineModalOpen(false)}
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
                    Tag Line 1
                  </label>
                  <input
                    type="text"
                    value={tagLine1}
                    onChange={(e) => setTagLine1(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter first tagline"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Tag Line 2
                  </label>
                  <input
                    type="text"
                    value={tagLine2}
                    onChange={(e) => setTagLine2(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter second tagline"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Product Tagline
                  </label>
                  <textarea
                    value={productTagline}
                    onChange={(e) => setProductTagline(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="4"
                    placeholder="Enter product tagline"
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
                  onClick={() => setIsTaglineModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleTaglineSave}
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

      {/* Social Media Modal */}
      <AnimatePresence>
        {isSocialModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsSocialModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
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
                  Social Media Links
                </motion.h2>
                <motion.button
                  onClick={() => setIsSocialModalOpen(false)}
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
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaFacebookF className="text-blue-600" />
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.facebook}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({
                        ...prev,
                        facebook: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaWhatsapp className="text-green-500" />
                    WhatsApp URL
                  </label>
                  <input
                    type="text"
                    value={socialLinks.whatsapp}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. 919000000000 or full wa.me link"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaInstagram className="text-pink-500" />
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.instagram}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({
                        ...prev,
                        instagram: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                 <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaYoutube className="text-red-500" />
                    Youtube URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.youtube}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({
                        ...prev,
                        youtube: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="https://youtube.com/yourhandle"
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
                  onClick={() => setIsSocialModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSocialSave}
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

      <style>
        {`
          @keyframes bubble-rise {
            0% { transform: translateY(0) scale(1); opacity: 0.7; }
            10% { opacity: 1; }
            100% { transform: translateY(-100vh) scale(0.6); opacity: 0; }
          }

          .hero-gradient {
            background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%);
          }

          .glass-effect {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .text-glow {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1);
          }
        `}
      </style>
    </div>
  );
};

export default Hero;
