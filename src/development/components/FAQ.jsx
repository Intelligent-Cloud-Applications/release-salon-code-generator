import React, { useState, useContext } from "react";
import { ChevronDown, ChevronUp, Trash2, Edit, Plus, X } from "lucide-react";
import Context from "../Context/Context";
// CHANGE 1: Import specific function from 'aws-amplify/api'
import { patch } from "aws-amplify/api";
import Confirm from "./ui/Confirm";

const FAQ = () => {
  const { institutionData, userData, setLoader, setInstitutionData } =
    useContext(Context);
  const faqData = institutionData?.faqData || [];
  const primaryColor = institutionData?.PrimaryColor || "#D4AF37";
  const institutionId = institutionData.institutionid;

  const [openIndex, setOpenIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const isAdmin = userData.userType === "admin";

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const openEditModal = (faq, index) => {
    setSelectedFaq({ ...faq, index });
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedFaq(null);
    setQuestion("");
    setAnswer("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (index) => {
    setSelectedFaq({ index });
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      alert("Question and answer cannot be empty");
      return;
    }

    try {
      setLoader(true);
      const updatedFaqData = selectedFaq
        ? faqData.map((faq, idx) =>
            idx === selectedFaq.index ? { question, answer } : faq,
          )
        : [...faqData, { question, answer }];

      // CHANGE 2: Updated API call syntax for v6
      // patch() returns an operation object. We await .response, then await .body.json()
      const restOperation = patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: {
            data: { faqData: updatedFaqData },
          },
        },
      });

      const { body } = await restOperation.response;
      const response = await body.json();

      if (response && response.item) {
        setInstitutionData((prevData) => ({
          ...prevData,
          faqData: updatedFaqData,
        }));
      } else {
        setInstitutionData((prevData) => ({
          ...prevData,
          faqData: updatedFaqData,
        }));
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert(`Failed to save FAQ: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoader(true);
      const updatedFaqData = faqData.filter((_, i) => i !== selectedFaq.index);

      // CHANGE 3: Updated API call syntax for v6
      const restOperation = patch({
        apiName: "main",
        path: `/admin/${institutionId}/update-ui`,
        options: {
          body: {
            data: { faqData: updatedFaqData },
          },
        },
      });

      const { body } = await restOperation.response;
      const response = await body.json();

      if (response && response.item) {
        setInstitutionData((prevData) => ({
          ...prevData,
          faqData: updatedFaqData,
        }));
      } else {
        setInstitutionData((prevData) => ({
          ...prevData,
          faqData: updatedFaqData,
        }));
      }

      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert(`Failed to delete FAQ: ${error.message || "Unknown error"}`);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-center text-2xl font-bold text-black sm:text-left sm:text-3xl">
            Frequently Asked Questions
          </h2>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-white shadow-md transition-all hover:shadow-lg sm:w-auto"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={20} /> Add FAQ
            </button>
          )}
        </div>

        <div className="space-y-4">
          {faqData.length === 0 && (
            <div className="rounded-lg bg-white py-12 text-center text-gray-500 shadow-sm">
              No FAQs available.{" "}
              {isAdmin && 'Click the "Add FAQ" button to create one.'}
            </div>
          )}

          {faqData.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex justify-between">
                <div
                  className="flex-grow cursor-pointer"
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="flex w-full items-center justify-between gap-4 px-5 py-4">
                    <h3
                      className="text-left text-lg font-medium transition-colors duration-200"
                      style={{
                        color: openIndex === index ? primaryColor : "#333",
                      }}
                    >
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      {openIndex === index ? (
                        <ChevronUp
                          className="h-6 w-6"
                          style={{ color: primaryColor }}
                        />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center pr-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(faq, index);
                      }}
                      className="rounded-full p-2 text-blue-500 transition-colors hover:bg-blue-50"
                      title="Edit FAQ"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(index);
                      }}
                      className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50"
                      title="Delete FAQ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {openIndex === index && (
                <div
                  className="border-t px-5 pb-5 pt-1 leading-relaxed text-gray-600"
                  style={{ borderColor: `${primaryColor}30` }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div
              className="flex items-center justify-between rounded-t-lg p-4"
              style={{ backgroundColor: primaryColor }}
            >
              <h2 className="text-lg font-semibold text-white">
                {selectedFaq ? "Edit FAQ" : "Create FAQ"}
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
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question"
                  className="w-full rounded-lg border p-3 text-base focus:outline-none focus:ring-2"
                  style={{
                    borderColor: `${primaryColor}50`,
                    boxShadow: `0 0 0 0 ${primaryColor}30`,
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="h-36 w-full rounded-lg border p-3 text-base focus:outline-none focus:ring-2"
                  style={{
                    borderColor: `${primaryColor}50`,
                    boxShadow: `0 0 0 0 ${primaryColor}30`,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t p-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg px-5 py-2 font-medium text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                disabled={!question.trim() || !answer.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <Confirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete FAQ"
        message="Are you sure you want to delete this FAQ? This action cannot be undone."
        primaryColor={primaryColor}
      />
    </div>
  );
};

export default FAQ;
