import React, { useState, useContext } from "react";
import { Mail, Phone, Edit, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "aws-amplify";
import Context from "../Context/Context";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Updated Styles with moderate dimensions
const styles = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideInLeft {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.animate-fadeIn { animation: fadeIn 0.6s ease-out; }
.animate-slideInLeft { animation: slideInLeft 0.6s ease-out forwards; }
.animate-slideInRight { animation: slideInRight 0.6s ease-out forwards; }

.contact-container {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    min-height: calc(100vh - 64px);
}

.form-input {
    transition: all 0.3s ease;
    border: 1px solid #d1d5db;
}

.form-input:focus {
    outline: none;
    border-color: #7cc143;
    box-shadow: 0 0 0 3px rgba(124, 193, 67, 0.2);
}

.map-container {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
}
`;

const Contact = () => {
  const { institutionData, userData, setLoader, setInstitutionData } =
    useContext(Context);

  const {
    Query_PhoneNumber = "",
    PrimaryColor = "#7cc143",
    visitUs: { locationMap = "", address = "" } = {},
  } = institutionData || {};

  const email = institutionData?.companyInfo?.ownerInformation?.email || "";
  const institutionId = institutionData?.institutionid || "";
  const isAdmin = userData?.userType === "admin";

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    message: "",
  });

  // Title/Description editing state
  const [isTitleDescModalOpen, setIsTitleDescModalOpen] = useState(false);
  const [contactTitle, setContactTitle] = useState("");
  const [contactDescription, setContactDescription] = useState("");

  // Contact info editing state
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactMapLink, setContactMapLink] = useState("");

  // Open title/description edit modal
  const openTitleDescModal = () => {
    setContactTitle(institutionData?.contact?.title || "");
    setContactDescription(institutionData?.contact?.description || "");
    setIsTitleDescModalOpen(true);
  };

  // Handle title/description save
  const handleTitleDescSave = async () => {
    try {
      setLoader(true);

      const response = await API.patch(
        "main",
        `/admin/${institutionId}/update-ui`,
        {
          body: {
            data: {
              contact: {
                title: contactTitle,
                description: contactDescription,
              },
            },
          },
        },
      );

      if (response && response.item) {
        setInstitutionData((prevData) => ({
          ...prevData,
          contact: {
            title: contactTitle,
            description: contactDescription,
          },
        }));
        toast.success("Contact section updated successfully");
      }
      setIsTitleDescModalOpen(false);
    } catch (error) {
      console.error("Error updating contact section:", error);
      toast.error("Failed to update contact section");
    } finally {
      setLoader(false);
    }
  };

  // Open contact info edit modal
  const openContactInfoModal = () => {
    setContactEmail(email);
    setContactPhone(Query_PhoneNumber);
    setContactAddress(address);
    setContactMapLink(locationMap);
    setIsContactInfoModalOpen(true);
  };

  // Handle contact info save
  const handleContactInfoSave = async () => {
    try {
      setLoader(true);

      const response = await API.patch(
        "main",
        `/admin/${institutionId}/update-ui`,
        {
          body: {
            data: {
              email: contactEmail,
              Query_PhoneNumber: contactPhone,
              visitUs: {
                address: contactAddress,
                locationMap: contactMapLink,
              },
            },
          },
        },
      );

      if (response && response.item) {
        setInstitutionData((prevData) => ({
          ...prevData,
          email: contactEmail,
          Query_PhoneNumber: contactPhone,
          visitUs: {
            ...prevData.visitUs,
            address: contactAddress,
            locationMap: contactMapLink,
          },
        }));
        toast.success("Contact information updated successfully");
      }
      setIsContactInfoModalOpen(false);
    } catch (error) {
      console.error("Error updating contact information:", error);
      toast.error("Failed to update contact information");
    } finally {
      setLoader(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, phoneNumber, message } = formData;
    const fullName = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName || !email || !phoneNumber || !message) {
      return toast.error("All fields are required");
    }

    try {
      setIsLoading(true);
      const apiName = "main";
      const path = `/any/${institutionData.institutionid}/create-query`;

      const myInit = {
        body: {
          fullName: fullName,
          emailId: email,
          phoneNumber: phoneNumber,
          message: message,
          userType: "member",
          adminEmail: email,
          isPaymentRedirect: false,
        },
      };

      await API.post(apiName, path, myInit);

      setTimeout(() => {
        toast.success(
          "Your message has been sent. We'll get back to you soon!",
        );
      }, 100);

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        message: "",
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const phoneRegex = /^[0-9]{0,10}$/;
      if (!phoneRegex.test(value)) return;
    }

    if (name === "firstName" || name === "lastName") {
      const nameRegex = /^[A-Za-z ]*$/;
      if (!nameRegex.test(value)) return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <style>{styles}</style>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex min-h-screen flex-col">
        <main className="contact-container lg:mt-18 mt-14 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <motion.div
              className="group relative mb-10 text-center"
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
                {institutionData?.contact?.title || "Get in Touch"}
              </h1>
              <p className="mt-2 text-base text-gray-600 sm:text-lg">
                {institutionData?.contact?.description ||
                  "We are here to assist you. Reach out to us!"}
              </p>

              {isAdmin && (
                <button
                  onClick={openTitleDescModal}
                  className="absolute right-0 top-0 rounded-full bg-white p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 group-hover:opacity-100"
                  style={{ border: `2px solid ${PrimaryColor}` }}
                >
                  <Edit size={16} style={{ color: PrimaryColor }} />
                </button>
              )}
            </motion.div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left Section - Contact Info & Map */}
              <div className="space-y-6">
                <motion.div
                  className="group relative rounded-lg bg-white p-5 shadow-md"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="mb-3 text-xl font-semibold text-gray-800">
                    Contact Information
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center space-x-3 transition-colors hover:text-gray-900">
                      <Mail
                        className="h-5 w-5"
                        style={{ color: PrimaryColor }}
                      />
                      <a href={`mailto:${email}`} className="text-base">
                        {email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-3 transition-colors hover:text-gray-900">
                      <Phone
                        className="h-5 w-5"
                        style={{ color: PrimaryColor }}
                      />
                      <a
                        href={`tel:${Query_PhoneNumber}`}
                        className="text-base"
                      >
                        {Query_PhoneNumber}
                      </a>
                    </div>
                    {address && (
                      <div className="flex items-start space-x-3 transition-colors hover:text-gray-900">
                        <MapPin
                          className="mt-0.5 h-5 w-5"
                          style={{ color: PrimaryColor }}
                        />
                        <span className="text-base">{address}</span>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={openContactInfoModal}
                      className="absolute right-2 top-2 rounded-full bg-white p-2 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 group-hover:opacity-100"
                      style={{ border: `2px solid ${PrimaryColor}` }}
                    >
                      <Edit size={14} style={{ color: PrimaryColor }} />
                    </button>
                  )}
                </motion.div>

                {/* Google Map */}
                {locationMap && (
                  <motion.div
                    className="map-container"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <iframe
                      src={locationMap}
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Location Map"
                    ></iframe>
                  </motion.div>
                )}
              </div>

              {/* Right Section - Form */}
              <div className="animate-slideInRight rounded-lg bg-white p-5 shadow-md">
                <h2 className="mb-2 text-xl font-semibold text-gray-800">
                  Send Us a Message
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                  We’d love to hear from you!
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      className="form-input w-full rounded-md p-2.5 text-sm"
                      onChange={handleChange}
                      value={formData.firstName}
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      className="form-input w-full rounded-md p-2.5 text-sm"
                      onChange={handleChange}
                      value={formData.lastName}
                      required
                    />
                  </div>

                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    className="form-input w-full rounded-md p-2.5 text-sm"
                    onChange={handleChange}
                    value={formData.email}
                    required
                  />

                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    className="form-input w-full rounded-md p-2.5 text-sm"
                    onChange={handleChange}
                    value={formData.phoneNumber}
                    required
                  />

                  <textarea
                    name="message"
                    placeholder="How can we assist you?"
                    rows="3" // Moderate rows
                    className="form-input w-full rounded-md p-2.5 text-sm"
                    onChange={handleChange}
                    value={formData.message}
                    required
                  />

                  <button
                    type="submit"
                    className="w-full rounded-md p-2.5 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: PrimaryColor }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Title/Description Edit Modal */}
      <AnimatePresence>
        {isTitleDescModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsTitleDescModalOpen(false)}
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
                  Edit Contact Section
                </motion.h2>
                <motion.button
                  onClick={() => setIsTitleDescModalOpen(false)}
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
                    Title
                  </label>
                  <input
                    type="text"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter contact title"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={contactDescription}
                    onChange={(e) => setContactDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="4"
                    placeholder="Enter contact description"
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
                  onClick={() => setIsTitleDescModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleTitleDescSave}
                  className="rounded-xl px-6 py-3 font-medium text-white shadow-lg"
                  style={{
                    background: `linear-gradient(45deg, ${PrimaryColor}, ${PrimaryColor}dd)`,
                    boxShadow: `0 4px 20px ${PrimaryColor}40`,
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: `0 6px 25px ${PrimaryColor}50`,
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

      {/* Contact Info Edit Modal */}
      <AnimatePresence>
        {isContactInfoModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsContactInfoModalOpen(false)}
          >
            <motion.div
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
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
                  Edit Contact Information
                </motion.h2>
                <motion.button
                  onClick={() => setIsContactInfoModalOpen(false)}
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="3"
                    placeholder="Enter business address"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Google Maps Embed Link
                  </label>
                  <textarea
                    value={contactMapLink}
                    onChange={(e) => setContactMapLink(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white/80 p-4 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none"
                    rows="4"
                    placeholder="Enter Google Maps embed URL"
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
                  onClick={() => setIsContactInfoModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleContactInfoSave}
                  className="rounded-xl px-6 py-3 font-medium text-white shadow-lg"
                  style={{
                    background: `linear-gradient(45deg, ${PrimaryColor}, ${PrimaryColor}dd)`,
                    boxShadow: `0 4px 20px ${PrimaryColor}40`,
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: `0 6px 25px ${PrimaryColor}50`,
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
    </>
  );
};

export default Contact;
