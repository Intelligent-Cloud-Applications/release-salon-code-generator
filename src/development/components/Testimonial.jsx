import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X } from "lucide-react";
import Context from "../Context/Context";

// --- Amplify v6 Imports ---
import { patch } from "aws-amplify/api";
import { uploadData, getUrl } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
const getConfig = Amplify.getConfig;
// --------------------------

import { toast } from "react-toastify";
import Confirm from "./ui/Confirm";

const Testimonial = () => {
  const { institutionData, userData, setLoader, setInstitutionData } =
    useContext(Context);
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
      setCurrentTestimonial((prev) =>
        prev === testimonials.length - 1 ? 0 : prev + 1,
      );
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

  // --- Updated: Upload image to S3 (Amplify v6) ---
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const fileName = `testimonials/${Date.now()}-${file.name}`;

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

  // --- Updated: Handle save (Amplify v6 API) ---
  const handleSave = async () => {
    if (!name.trim() || !text.trim()) {
      toast.error("Name and text are required");
      return;
    }

    try {
      setLoader(true);
      const imageUrl = imageFile
        ? await uploadImageToS3(imageFile)
        : selectedTestimonial?.image;
      const updatedTestimonial = {
        name,
        rating,
        text,
        image: imageUrl || selectedTestimonial?.image,
      };
      let updatedTestimonials;

      if (selectedTestimonial) {
        updatedTestimonials = testimonials.map((t, i) =>
          i === selectedTestimonial.index ? updatedTestimonial : t,
        );
      } else {
        updatedTestimonials = [...testimonials, updatedTestimonial];
      }

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: { testimonials: updatedTestimonials } },
        },
      }).response;

      setInstitutionData((prev) => ({
        ...prev,
        testimonials: updatedTestimonials,
      }));
      setIsModalOpen(false);
      toast.success(
        selectedTestimonial ? "Testimonial updated" : "Testimonial added",
      );
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error(
        `Failed to save testimonial: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoader(false);
    }
  };

  // --- Updated: Handle delete (Amplify v6 API) ---
  const handleDelete = async () => {
    try {
      setLoader(true);
      const updatedTestimonials = testimonials.filter(
        (_, i) => i !== selectedTestimonial.index,
      );

      await patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: { data: { testimonials: updatedTestimonials } },
        },
      }).response;

      setInstitutionData((prev) => ({
        ...prev,
        testimonials: updatedTestimonials,
      }));
      setIsDeleteModalOpen(false);
      toast.success("Testimonial deleted");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error(
        `Failed to delete testimonial: ${error.message || "Unknown error"}`,
      );
    } finally {
      setLoader(false);
    }
  };

  const hasValidTestimonials =
    testimonials.length > 0 && testimonials[currentTestimonial];

  return (
    <div className="relative bg-gray-200 px-4 pt-16 sm:px-6">
      <div className="container mx-auto lg:px-14">
        <div className="mb-8 text-center sm:mb-16 sm:text-left">
          <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:mb-6 sm:text-4xl">
            What People Say
          </h2>
          <p className="text-gray-600">Learn what people say about us</p>
        </div>

        <div className="flex flex-col items-center justify-between lg:flex-row lg:items-start">
          {/* Testimonials Slider - Full width on mobile, half width on larger screens */}
          <div className="mb-12 w-full lg:mb-0 lg:w-1/2">
            {isAdmin && (
              <button
                onClick={() => openModal()}
                className="mx-auto mb-4 flex items-center gap-2 rounded-md px-4 py-2 text-white shadow-md hover:opacity-90 sm:mx-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus size={20} /> Add Testimonial
              </button>
            )}
            <div className="relative mx-auto h-[200px] overflow-hidden sm:mx-0">
              {hasValidTestimonials ? (
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                    className="absolute w-full rounded-lg bg-white p-4 shadow-md sm:p-8"
                  >
                    <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-4">
                      <img
                        src={
                          testimonials[currentTestimonial].image ||
                          "/default-avatar.png"
                        }
                        alt={
                          testimonials[currentTestimonial].name || "Anonymous"
                        }
                        className="h-12 w-12 rounded-full object-cover sm:h-16 sm:w-16"
                      />
                      <div>
                        <p className="text-base font-semibold text-gray-800 sm:text-lg">
                          {testimonials[currentTestimonial].name || "Anonymous"}
                        </p>
                        <div className="flex gap-1 text-sm text-yellow-400">
                          {Array.from(
                            {
                              length:
                                testimonials[currentTestimonial].rating || 0,
                            },
                            (_, i) => (
                              <span key={i}>★</span>
                            ),
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() =>
                              openModal(
                                testimonials[currentTestimonial],
                                currentTestimonial,
                              )
                            }
                            className="rounded-full p-1 text-blue-500 hover:bg-blue-50"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(currentTestimonial)}
                            className="rounded-full p-1 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 sm:text-base">
                      {testimonials[currentTestimonial].text ||
                        "No review available"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-white p-8 shadow-md">
                  <p className="text-gray-600">No testimonials available</p>
                </div>
              )}
            </div>

            {/* Navigation Dots */}
            {hasValidTestimonials && (
              <div
                className={`flex gap-2 ${isAdmin ? "sm:mt-8" : "mt-2 sm:mt-4"} justify-center sm:justify-start`}
              >
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-2 w-2 rounded-full transition-colors duration-300`}
                    style={{
                      backgroundColor:
                        currentTestimonial === index ? primaryColor : "#D1D5DB",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Image Section - Hidden on mobile, visible on larger screens */}
          <motion.div
            className="relative hidden w-full md:block lg:w-1/2 lg:pl-8"
            initial="hidden"
            animate={hasAnimated ? "visible" : "hidden"}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
            onViewportEnter={() => !hasAnimated && setHasAnimated(true)}
          >
            <div className="relative -mt-10 w-full lg:-mt-32">
              <img
                src={testimonialImg || "/default-testimonial-img.png"}
                alt="Testimonial Background"
                className="h-auto max-h-[400px] w-full object-contain lg:max-h-[600px]"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div
              className="flex items-center justify-between rounded-t-lg p-4"
              style={{ backgroundColor: primaryColor }}
            >
              <h2 className="text-lg font-semibold text-white">
                {selectedTestimonial ? "Edit Testimonial" : "Add Testimonial"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-white hover:bg-black hover:bg-opacity-20 hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border p-3"
                  style={{ borderColor: `${primaryColor}50` }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full rounded-lg border p-3"
                  style={{ borderColor: `${primaryColor}50` }}
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} Stars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Review
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="h-32 w-full rounded-lg border p-3"
                  style={{ borderColor: `${primaryColor}50` }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                  Choose File
                </button>
                {imageFile && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t p-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg px-5 py-2 text-white hover:opacity-90"
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
