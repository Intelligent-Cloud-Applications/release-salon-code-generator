import React, { useContext } from "react";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import { IoLocationSharp, IoMail } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import Context from "../Context/Context";

const Footer = () => {
    const { institutionData } = useContext(Context);

    const {
        socialMediaLinks,
        ourMission: { description = "" } = {},
        Query_Address = "",
        Query_PhoneNumber = "",
        email = "",
        PrimaryColor = "#000000",
        companyName = "Your Company"
    } = institutionData || {};

    // ✅ Ensure socialMediaLinks is an array before reducing
    const socialLinksMap = Array.isArray(socialMediaLinks)
        ? socialMediaLinks.reduce((acc, link) => {
            acc[link.platform.toLowerCase()] = link.url;
            return acc;
        }, {})
        : {};

    return (
        <footer className="bg-gray-100 py-10 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
                {/* About Us */}
                <div className="md:w-1/2">
                    <h2 className="text-xl font-bold mb-3">About Us</h2>
                    <p className="text-gray-600">{description}</p>

                    {/* Social Icons */}
                    <div className="flex gap-4 mt-4">
                        {socialLinksMap.facebook && (
                            <a 
                                href={socialLinksMap.facebook} 
                                className="p-3 rounded-md bg-gray-200 hover:bg-gray-300"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FaFacebookF style={{ color: PrimaryColor }} />
                            </a>
                        )}
                        {socialLinksMap.twitter && (
                            <a 
                                href={socialLinksMap.twitter} 
                                className="p-3 rounded-md bg-gray-200 hover:bg-gray-300"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FaTwitter style={{ color: PrimaryColor }} />
                            </a>
                        )}
                        {socialLinksMap.instagram && (
                            <a 
                                href={socialLinksMap.instagram} 
                                className="p-3 rounded-md bg-gray-200 hover:bg-gray-300"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FaInstagram style={{ color: PrimaryColor }} />
                            </a>
                        )}
                        {/* Future: Add LinkedIn or other platforms if needed */}
                    </div>
                </div>

                {/* Contact Us */}
                <div className="md:w-1/2 text-left">
                    <h2 className="text-xl font-bold mb-3">Contact Us</h2>
                    <div className="space-y-3 text-gray-600">
                        {Query_Address && (
                            <div className="flex items-center gap-3">
                                <IoLocationSharp style={{ color: PrimaryColor }} />
                                <span>{Query_Address}</span>
                            </div>
                        )}
                        {Query_PhoneNumber && (
                            <div className="flex items-center gap-3">
                                <FiPhone style={{ color: PrimaryColor }} />
                                <span>{Query_PhoneNumber}</span>
                            </div>
                        )}
                        {email && (
                            <div className="flex items-center gap-3">
                                <IoMail style={{ color: PrimaryColor }} />
                                <span>{email}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center mt-6 text-gray-500">
                © {new Date().getFullYear()} {companyName}
            </div>
        </footer>
    );
};

export default Footer;
