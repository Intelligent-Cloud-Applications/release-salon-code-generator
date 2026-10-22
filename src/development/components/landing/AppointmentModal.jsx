import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { submitContactForm } from '../utils/contactApi';
import { useSiteData } from '../context/SiteContext';

const AppointmentModal = ({ isOpen, onClose }) => {
  const siteData = useSiteData();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Hair Styling & Updo',
    date: '2026-08-10',
    time: '14:00',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      await submitContactForm({
        payload: {
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `Appointment Booking: ${formData.service}`,
          message: `Booking Details:\nService: ${formData.service}\nDate: ${formData.date} at ${formData.time}\nNotes: ${formData.notes || 'None'}`,
          service: formData.service,
          date: formData.date,
          time: formData.time,
        },
        siteData: siteData,
        formName: 'Tekkzy Salon Appointment Booking',
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#191514]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#F4EDE3] border border-[#4B080C]/20 w-full max-w-lg p-5 sm:p-8 md:p-10 relative shadow-2xl overflow-y-auto max-h-[90vh] sm:max-h-[85vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 text-[#4B080C] hover:text-[#75171D] p-1 transition-colors cursor-pointer z-10"
        >
          <X size={22} />
        </button>

        {submitted ? (
          <div className="py-8 sm:py-12 flex flex-col items-center text-center space-y-3 sm:space-y-4">
            <CheckCircle2 size={48} className="text-[#4B080C] animate-bounce sm:w-14 sm:h-14" />
            <h3 className="font-serif text-2xl sm:text-3xl text-[#4B080C]">Appointment Reserved</h3>
            <p className="font-script text-xl sm:text-2xl text-[#75171D]">Beauty. Confidence. You.</p>
            <p className="text-xs sm:text-sm text-[#191514] max-w-xs leading-relaxed">
              Thank you {formData.name || 'valued guest'}. Our salon concierge will confirm your session shortly.
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-4 sm:mb-6 pr-8">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-[#75171D] uppercase block mb-1">
                EXCLUSIVITY & CARETENDING
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#4B080C] uppercase tracking-wide">
                BOOK APPOINTMENT
              </h2>
              <p className="font-script text-xl sm:text-2xl text-[#4B080C] mt-1">
                Tekkzy Salon Session
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold tracking-wider text-[#191514] uppercase mb-1 sm:mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Victoria Sterling"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#EAE0D3] border border-[#4B080C]/20 px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-[#191514] focus:outline-none focus:border-[#4B080C] transition-colors rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold tracking-wider text-[#191514] uppercase mb-1 sm:mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="victoria@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#EAE0D3] border border-[#4B080C]/20 px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-[#191514] focus:outline-none focus:border-[#4B080C] transition-colors rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold tracking-wider text-[#191514] uppercase mb-1 sm:mb-1.5">
                    Phone / Mobile
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#EAE0D3] border border-[#4B080C]/20 px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-[#191514] focus:outline-none focus:border-[#4B080C] transition-colors rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold tracking-wider text-[#191514] uppercase mb-1 sm:mb-1.5">
                    Desired Service
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full bg-[#EAE0D3] border border-[#4B080C]/20 px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-[#191514] focus:outline-none focus:border-[#4B080C] transition-colors rounded-sm"
                  >
                    <option>Hair Styling & Couture Updo</option>
                    <option>Skin Radiance Facial & Glow</option>
                    <option>Editorial Salon Makeup</option>
                    <option>Luxury Nail Art</option>
                    <option>Full VIP Salon Experience</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold tracking-wider text-[#191514] uppercase mb-1 sm:mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#EAE0D3] border border-[#4B080C]/20 px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-[#191514] focus:outline-none focus:border-[#4B080C] transition-colors rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold tracking-wider text-[#191514] uppercase mb-1 sm:mb-1.5">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-[#EAE0D3] border border-[#4B080C]/20 px-3 sm:px-4 py-2 sm:py-2.5 text-base sm:text-sm text-[#191514] focus:outline-none focus:border-[#4B080C] transition-colors rounded-sm"
                  />
                </div>
              </div>

              <div className="pt-3 sm:pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#4B080C] text-[#F4EDE3] text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] py-3 sm:py-3.5 uppercase hover:bg-[#75171D] transition-colors shadow-md cursor-pointer rounded-sm"
                >
                  CONFIRM APPOINTMENT
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;
