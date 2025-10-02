import React, { useState, useContext } from 'react';
import { ChevronDown, ChevronUp, Trash2, Edit, Plus, X } from 'lucide-react';
import Context from '../Context/Context';
import { API } from 'aws-amplify';
import Confirm from './ui/Confirm';

const FAQ = () => {
  const { institutionData, userData, setLoader, setInstitutionData } = useContext(Context);
  const faqData = institutionData?.faqData || [];
  const primaryColor = institutionData?.PrimaryColor || "#D4AF37";
  const institutionId = institutionData.institutionid;

  const [openIndex, setOpenIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const isAdmin = userData.userType === 'admin';

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
    setQuestion('');
    setAnswer('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (index) => {
    setSelectedFaq({ index });
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      alert('Question and answer cannot be empty');
      return;
    }

    try {
      setLoader(true);
      const updatedFaqData = selectedFaq 
        ? faqData.map((faq, idx) => 
            idx === selectedFaq.index ? { question, answer } : faq
          )
        : [...faqData, { question, answer }];

      const response = await API.patch('main', `/admin/${institutionId}/update-ui`, {
        body: {
          data: { faqData: updatedFaqData }
        }
      });

      if (response && response.item) {
        setInstitutionData(prevData => ({
          ...prevData,
          faqData: updatedFaqData
        }));
      } else {
        setInstitutionData(prevData => ({
          ...prevData,
          faqData: updatedFaqData
        }));
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert(`Failed to save FAQ: ${error.message || 'Unknown error'}`);
    } finally {
      setLoader(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoader(true);
      const updatedFaqData = faqData.filter((_, i) => i !== selectedFaq.index);
      
      const response = await API.patch('main', `/admin/${institutionId}/update-ui`, {
        body: {
          data: { faqData: updatedFaqData }
        }
      });

      if (response && response.item) {
        setInstitutionData(prevData => ({
          ...prevData,
          faqData: updatedFaqData
        }));
      } else {
        setInstitutionData(prevData => ({
          ...prevData,
          faqData: updatedFaqData
        }));
      }

      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert(`Failed to delete FAQ: ${error.message || 'Unknown error'}`);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center sm:text-left text-black">
            Frequently Asked Questions
          </h2>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-5 py-3 text-white rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={20} /> Add FAQ
            </button>
          )}
        </div>

        <div className="space-y-4">
          {faqData.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">
              No FAQs available. {isAdmin && 'Click the "Add FAQ" button to create one.'}
            </div>
          )}
          
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="flex justify-between">
                <div 
                  className="flex-grow cursor-pointer" 
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="w-full px-5 py-4 flex justify-between items-center gap-4">
                    <h3
                      className="text-lg font-medium text-left transition-colors duration-200"
                      style={{ color: openIndex === index ? primaryColor : "#333" }}
                    >
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      {openIndex === index ? (
                        <ChevronUp className="w-6 h-6" style={{ color: primaryColor }} />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-500" />
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
                      className="p-2 rounded-full text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Edit FAQ"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(index);
                      }}
                      className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {openIndex === index && (
                <div 
                  className="px-5 pb-5 pt-1 text-gray-600 border-t leading-relaxed"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 rounded-t-lg" style={{ backgroundColor: primaryColor }}>
              <h2 className="text-lg font-semibold text-white">
                {selectedFaq ? 'Edit FAQ' : 'Create FAQ'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:outline-none text-base"
                  style={{ borderColor: `${primaryColor}50`, boxShadow: `0 0 0 0 ${primaryColor}30` }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:outline-none text-base h-36"
                  style={{ borderColor: `${primaryColor}50`, boxShadow: `0 0 0 0 ${primaryColor}30` }}
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 text-white rounded-lg hover:opacity-90 font-medium shadow-sm"
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