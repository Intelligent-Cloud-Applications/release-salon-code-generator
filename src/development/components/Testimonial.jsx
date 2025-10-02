import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X } from "lucide-react";
import Context from "../Context/Context";
import { API, Storage } from "aws-amplify";
import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import Confirm from "./ui/Confirm";

const Testimonial = () => {
  const { institutionData, userData, setLoader, setInstitutionData } = useContext(Context);
  const testimonials = institutionData?.testimonials || [];
  const testimonialImg = institutionData?.testimonialImg;
  const primaryColor = institutionData?.PrimaryColor || "#D4AF37";
  const institutionId = institutionData?.institutionid;

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const isAdmin = userData?.userType === "admin";

  const nextTestimonial = useCallback(() => {
    if (testimonials.length > 0) {
      setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length > 0) {
      const interval = setInterval(nextTestimonial, 5000);
      return () => clearInterval(interval);
    }
  }, [nextTestimonial, testimonials.length]);

  const variants = {
    enter: { x: "100%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  };

  // Upload image to S3
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `testimonials/${Date.now()}-${file.name}`;
      const result = await Storage.put(fileName, file, {
        level: "public",
        contentType: file.type,
      });
      return `https://${Storage._config.AWSS3.bucket}.s3.${Storage._config.AWSS3.region}.amazonaws.com/public/${result.key}`;
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      toast.error("Failed to upload image");
      throw error;
    }
  };

  // Open create/edit modal
  const openModal = (testimonial = null, index = null) => {
    setSelectedTestimonial(testimonial ? { ...testimonial, index } : null);
    setName(testimonial?.name || "");
    setRating(testimonial?.rating || 5);
    setText(testimonial?.text || "");
    setImageFile(null);
    setIsModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (index) => {
    setSelectedTestimonial({ index });
    setIsDeleteModalOpen(true);
  };

  // Handle save (create/update)
  const handleSave = async () => {
    if (!name.trim() || !text.trim()) {
      toast.error("Name and text are required");
      return;
    }

    try {
      setLoader(true);
      const imageUrl = imageFile ? await uploadImageToS3(imageFile) : selectedTestimonial?.image;
      const updatedTestimonial = { name, rating, text, image: imageUrl || selectedTestimonial?.image };
      let updatedTestimonials;

      if (selectedTestimonial) {
        updatedTestimonials = testimonials.map((t, i) =>
          i === selectedTestimonial.index ? updatedTestimonial : t
        );
      } else {
        updatedTestimonials = [...testimonials, updatedTestimonial];
      }

      const response = await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: { testimonials: updatedTestimonials } },
      });

      setInstitutionData((prev) => ({
        ...prev,
        testimonials: updatedTestimonials,
      }));
      setIsModalOpen(false);
      toast.success(selectedTestimonial ? "Testimonial updated" : "Testimonial added");
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error(`Failed to save testimonial: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoader(true);
      const updatedTestimonials = testimonials.filter((_, i) => i !== selectedTestimonial.index);

      const response = await API.patch("main", `/admin/${institutionId}/update-ui`, {
        body: { data: { testimonials: updatedTestimonials } },
      });

      setInstitutionData((prev) => ({
        ...prev,
        testimonials: updatedTestimonials,
      }));
      setIsDeleteModalOpen(false);
      toast.success("Testimonial deleted");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error(`Failed to delete testimonial: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  const hasValidTestimonials = testimonials.length > 0 && testimonials[currentTestimonial];

  return (
    <div className="relative bg-gray-200 pt-16 px-4 sm:px-6">
      <div className="container mx-auto lg:px-14">
        <div className="mb-8 sm:mb-16 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-6">What People Say</h2>
          <p className="text-gray-600">Learn what people say about us</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between">
          {/* Testimonials Slider - Full width on mobile, half width on larger screens */}
          <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
            {isAdmin && (
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-md shadow-md mb-4 hover:opacity-90 mx-auto sm:mx-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus size={20} /> Add Testimonial
              </button>
            )}
            <div className="relative h-[200px] mx-auto sm:mx-0 overflow-hidden">
              {hasValidTestimonials ? (
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                    className="absolute w-full bg-white p-4 sm:p-8 rounded-lg shadow-md"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <img
                        src={testimonials[currentTestimonial].image || "/default-avatar.png"}
                        alt={testimonials[currentTestimonial].name || "Anonymous"}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-base sm:text-lg font-semibold text-gray-800">
                          {testimonials[currentTestimonial].name || "Anonymous"}
                        </p>
                        <div className="flex gap-1 text-sm text-yellow-400">
                          {Array.from({ length: testimonials[currentTestimonial].rating || 0 }, (_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() => openModal(testimonials[currentTestimonial], currentTestimonial)}
                            className="text-blue-500 hover:bg-blue-50 p-1 rounded-full"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(currentTestimonial)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">
                      {testimonials[currentTestimonial].text || "No review available"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="w-full bg-white p-8 rounded-lg shadow-md h-full flex items-center justify-center">
                  <p className="text-gray-600">No testimonials available</p>
                </div>
              )}
            </div>

            {/* Navigation Dots */}
            {hasValidTestimonials && (
              <div className={`flex gap-2 ${isAdmin ? "sm:mt-8" : "mt-2 sm:mt-4"} justify-center sm:justify-start`}>
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-colors duration-300`}
                    style={{
                      backgroundColor: currentTestimonial === index ? primaryColor : "#D1D5DB",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Image Section - Hidden on mobile, visible on larger screens */}
          <motion.div
            className="hidden md:block w-full lg:w-1/2 lg:pl-8 relative"
            initial="hidden"
            animate={hasAnimated ? "visible" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
            onViewportEnter={() => !hasAnimated && setHasAnimated(true)}
          >
            <div className="relative w-full -mt-10 lg:-mt-32">
              <img
                src={testimonialImg || "/default-testimonial-img.png"}
                alt="Testimonial Background"
                className="w-full h-auto max-h-[400px] lg:max-h-[600px] object-contain"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 rounded-t-lg" style={{ backgroundColor: primaryColor }}>
              <h2 className="text-lg font-semibold text-white">
                {selectedTestimonial ? "Edit Testimonial" : "Add Testimonial"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-black hover:bg-opacity-20"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: `${primaryColor}50` }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: `${primaryColor}50` }}
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>{r} Stars</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full p-3 border rounded-lg h-32"
                  style={{ borderColor: `${primaryColor}50` }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200"
                >
                  Choose File
                </button>
                {imageFile && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Confirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This action cannot be undone."
        primaryColor={primaryColor}
      />
    </div>
  );
};

export default Testimonial;