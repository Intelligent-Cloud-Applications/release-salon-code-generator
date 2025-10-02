import React, { useContext } from "react";
import Context from "../Context/Context"; // Assuming Context is used to provide institutionData

const Loader = () => {
  const { institutionData } = useContext(Context);  // Accessing institutionData from context

  const primaryColor = institutionData.PrimaryColor;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "#ffffff", opacity: 1 }} // Keeping background color white
    >
      <div className="flex flex-row gap-2 justify-center items-center">
        <div
          className="w-4 h-4 rounded-full animate-bounce"
          style={{ backgroundColor: primaryColor }}
        ></div>
        <div
          className="w-4 h-4 rounded-full animate-bounce [animation-delay:-.3s]"
          style={{ backgroundColor: primaryColor }}
        ></div>
        <div
          className="w-4 h-4 rounded-full animate-bounce [animation-delay:-.5s]"
          style={{ backgroundColor: primaryColor }}
        ></div>
      </div>
    </div>
  );
};

export default Loader;
