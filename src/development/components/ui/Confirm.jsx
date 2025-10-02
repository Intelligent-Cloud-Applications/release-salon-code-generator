import React from "react";
import { X } from "lucide-react";

const Confirm = ({ isOpen, onClose, onConfirm, title, message, primaryColor }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b" style={{ backgroundColor: primaryColor }}>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 text-center">{message}</p>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white rounded-md hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirm;