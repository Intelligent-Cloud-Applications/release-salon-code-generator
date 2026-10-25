import React, { useState, useEffect, useContext } from "react";
import {
  Building2,
  Receipt,
  Printer,
  Save,
  Upload,
  Check,
  Percent,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import Context from "../Context/Context";
import { cn } from "../lib/utils";
import ScissorsLoader from "../components/Loader";

export const getStoredPrinterSettings = () => {
  try {
    const raw = localStorage.getItem("salon_billing_printer_settings");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    printerType: "usb", // 'bluetooth' | 'usb'
    paperSize: "80mm", // '80mm' | '58mm' | 'a4'
    receiptTitle: "TAX INVOICE",
    footerMessage: "Thank you for visiting! Please visit again.",
    termsAndConditions: "Goods once sold or services rendered will not be refunded.",
    showStylist: true,
    showGstBreakdown: true,
  };
};

export const getStoredGstSettings = (institutionData = null) => {
  try {
    const raw = localStorage.getItem("salon_billing_gst_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        gstEnabled: parsed.gstEnabled ?? true,
        defaultGstRate: Number(parsed.defaultGstRate != null ? parsed.defaultGstRate : 18),
        gstNumber: parsed.gstNumber || institutionData?.gstNumber || "",
      };
    }
  } catch (e) {}
  return {
    gstEnabled: true,
    defaultGstRate: Number(institutionData?.gstRate || 18),
    gstNumber: institutionData?.gstNumber || "",
  };
};

const SettingsPage = () => {
  const { institutionData, setInstitutionData, updateLandingPageData, landingPageData } = useContext(Context);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("branding"); // 'branding' | 'gst' | 'printer'
  const [isSaving, setIsSaving] = useState(false);

  // Salon Branding State
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [tagline, setTagline] = useState("");

  // GST & Taxes State
  const [gstEnabled, setGstEnabled] = useState(true);
  const [defaultGstRate, setDefaultGstRate] = useState(18);
  const [gstNumber, setGstNumber] = useState("");

  // Printer & Receipt State
  const [printerType, setPrinterType] = useState("usb"); // 'bluetooth' | 'usb'
  const [paperSize, setPaperSize] = useState("80mm"); // '80mm' | '58mm' | 'a4'
  const [receiptTitle, setReceiptTitle] = useState("TAX INVOICE");
  const [footerMessage, setFooterMessage] = useState("Thank you for visiting! Please visit again.");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "Goods once sold or services rendered will not be refunded."
  );
  const [showStylist, setShowStylist] = useState(true);
  const [showGstBreakdown, setShowGstBreakdown] = useState(true);

  // Initialize from institutionData and localStorage
  useEffect(() => {
    const displayName =
      institutionData?.companyName ||
      institutionData?.InstitutionName ||
      landingPageData?.navigation?.logo?.text ||
      "Tekkzy Hair Salon";
    setCompanyName(displayName);

    setLogoUrl(
      institutionData?.logoUrl ||
      landingPageData?.navigation?.logo?.image ||
      ""
    );

    setPhoneNumber(
      institutionData?.Query_PhoneNumber ||
      institutionData?.Contact ||
      institutionData?.phoneNumber ||
      ""
    );

    setEmail(institutionData?.email || "");

    setAddress(
      institutionData?.Query_Address ||
      institutionData?.Address ||
      institutionData?.address ||
      ""
    );

    setTagline(institutionData?.tagline || "Premium Hair, Beauty & Spa Care");

    // Load GST settings
    const gstConf = getStoredGstSettings(institutionData);
    setGstEnabled(gstConf.gstEnabled);
    setDefaultGstRate(gstConf.defaultGstRate);
    setGstNumber(gstConf.gstNumber);

    // Load Printer settings
    const printConf = getStoredPrinterSettings();
    setPrinterType(printConf.printerType || "usb");
    setPaperSize(printConf.paperSize || "80mm");
    setReceiptTitle(printConf.receiptTitle || "TAX INVOICE");
    setFooterMessage(printConf.footerMessage || "Thank you for visiting! Please visit again.");
    setTermsAndConditions(printConf.termsAndConditions || "Goods once sold or services rendered will not be refunded.");
    setShowStylist(printConf.showStylist ?? true);
    setShowGstBreakdown(printConf.showGstBreakdown ?? true);
  }, [institutionData, landingPageData]);

  // Handle Save
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // 1. Save Printer settings to localStorage
      const printerConfig = {
        printerType,
        paperSize,
        receiptTitle: receiptTitle.trim() || "TAX INVOICE",
        footerMessage: footerMessage.trim(),
        termsAndConditions: termsAndConditions.trim(),
        showStylist,
        showGstBreakdown,
      };
      localStorage.setItem("salon_billing_printer_settings", JSON.stringify(printerConfig));

      // 2. Save GST settings to localStorage
      const gstConfig = {
        gstEnabled,
        defaultGstRate: Number(defaultGstRate) || 0,
        gstNumber: gstNumber.trim(),
      };
      localStorage.setItem("salon_billing_gst_settings", JSON.stringify(gstConfig));

      // 3. Save Branding & GST to backend via updateLandingPageData
      const updatedLanding = {
        ...(landingPageData || {}),
        navigation: {
          ...(landingPageData?.navigation || {}),
          logo: {
            text: companyName.trim(),
            image: logoUrl.trim(),
          },
        },
        site: {
          ...(landingPageData?.site || {}),
          name: companyName.trim(),
          logoImage: logoUrl.trim(),
        },
        contact: {
          ...(landingPageData?.contact || {}),
          locationCard: {
            phone: phoneNumber.trim(),
            address: address.trim(),
            email: email.trim(),
          },
        },
      };

      if (updateLandingPageData) {
        await updateLandingPageData(updatedLanding);
      }

      // Also update institutionData in Context
      if (setInstitutionData) {
        setInstitutionData((prev) => ({
          ...(prev || {}),
          companyName: companyName.trim(),
          logoUrl: logoUrl.trim(),
          Query_PhoneNumber: phoneNumber.trim(),
          email: email.trim(),
          Query_Address: address.trim(),
          tagline: tagline.trim(),
          gstRate: Number(defaultGstRate) || 0,
          gstNumber: gstNumber.trim(),
          printerType,
          paperSize,
        }));
      }

      toast({
        title: "Settings Saved Successfully!",
        description: "Your salon branding, GST configuration, and printer settings have been updated.",
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast({
        variant: "destructive",
        title: "Error Saving Settings",
        description: "Could not save settings to server. Local settings were updated.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      {/* 1. Header Bar */}
      <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Salon & Billing Settings
              </h1>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                POS & Invoicing
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure salon profile, dynamic GST calculation, bluetooth/USB printers, and thermal receipts
            </p>
          </div>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          {isSaving ? (
            <ScissorsLoader text="Saving..." />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save All Settings</span>
            </>
          )}
        </Button>
      </div>

      {/* 2. Main Content Grid: Settings Forms (Left) + Live Receipt Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Settings Forms (7 Columns) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Navigation Tabs */}
          <div className="bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs flex gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab("branding")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === "branding"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Salon Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("gst")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === "gst"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>GST & Taxes</span>
            </button>
            <button
              onClick={() => setActiveTab("printer")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === "printer"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printer & Receipt</span>
            </button>
          </div>

          {/* TAB 1: Salon Profile & Branding */}
          {activeTab === "branding" && (
            <Card className="border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-bold text-sm text-slate-900">Salon Branding & Contact Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These details will appear at the header of all printed customer bills and invoices
                </p>
              </div>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Company / Salon Name</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Tekkzy Luxury Hair & Spa Studio"
                      className="h-8 text-xs rounded-lg border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Tagline / Slogan</Label>
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Premium Hair, Beauty & Spa Care"
                      className="h-8 text-xs rounded-lg border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Logo Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/salon-logo.png"
                      className="h-8 text-xs rounded-lg border-slate-200 flex-1 font-mono text-[11px]"
                    />
                    {logoUrl && (
                      <div className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 p-0.5 flex items-center justify-center shrink-0">
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    High contrast black & white or transparent PNG works best on thermal receipt printers
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Phone Number (Printed on Bill)</Label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-8 h-8 text-xs rounded-lg border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Email Address (Optional)</Label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="billing@salon.com"
                        className="pl-8 h-8 text-xs rounded-lg border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Full Salon Address</Label>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop #12, Ground Floor, Central Mall, MG Road, Mumbai - 400001"
                    rows={2}
                    className="text-xs rounded-lg border-slate-200 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: GST & Taxes */}
          {activeTab === "gst" && (
            <Card className="border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-bold text-sm text-slate-900">Dynamic GST & Tax Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set your default GST percentage and GSTIN. POS Billing will automatically use this rate.
                </p>
              </div>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Enable GST on POS Invoices</h4>
                    <p className="text-[11px] text-slate-500">Calculate GST tax automatically during billing</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Default GST Rate (%)</Label>
                    <div className="relative">
                      <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={defaultGstRate}
                        onChange={(e) => setDefaultGstRate(e.target.value)}
                        placeholder="18"
                        className="pl-8 h-8 text-xs rounded-lg border-slate-200 font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Standard Indian salon rates: 18% (Hair & Spa treatments) or 12% / 5%
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">GSTIN / Tax Identification No.</Label>
                    <Input
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="h-8 text-xs rounded-lg border-slate-200 font-mono uppercase"
                    />
                    <p className="text-[10px] text-slate-400">
                      Will be printed directly on every tax invoice receipt
                    </p>
                  </div>
                </div>

                {/* Quick GST Chips */}
                <div className="pt-2">
                  <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Quick Choose Standard Slab
                  </Label>
                  <div className="flex gap-2">
                    {[0, 5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setDefaultGstRate(rate)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                          Number(defaultGstRate) === rate
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {rate}% GST
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Printer & Receipt Settings */}
          {activeTab === "printer" && (
            <Card className="border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-bold text-sm text-slate-900">Thermal Printer & Receipt Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure Bluetooth or USB thermal printer options and receipt layout
                </p>
              </div>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Printer Type: Bluetooth vs USB */}
                <div>
                  <Label className="text-xs font-bold text-slate-700 block mb-2">
                    Primary Printer Connection Mode
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPrinterType("bluetooth")}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer",
                        printerType === "bluetooth"
                          ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-500 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">Bluetooth Printer</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Wireless mobile thermal printer (ESC/POS 58mm/80mm) for Android/iOS tablets & phones
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrinterType("usb")}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer",
                        printerType === "usb"
                          ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-500 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">USB / Desktop Printer</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          USB, Network, or Desktop Thermal POS printer via browser print dialog
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Paper Size */}
                <div>
                  <Label className="text-xs font-bold text-slate-700 block mb-2">
                    Receipt Roll Paper Size
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "80mm", label: "80mm Thermal (Standard)", desc: "Wide 3-inch counter roll" },
                      { id: "58mm", label: "58mm Thermal (Compact)", desc: "2-inch portable roll" },
                      { id: "a4", label: "A4 / A5 Standard Sheet", desc: "Standard PDF document" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaperSize(p.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                          paperSize === p.id
                            ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-500"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        )}
                      >
                        <h5 className="font-bold text-xs text-slate-900">{p.label}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Receipt Header & Footer Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Receipt Header Title</Label>
                    <Input
                      value={receiptTitle}
                      onChange={(e) => setReceiptTitle(e.target.value)}
                      placeholder="TAX INVOICE"
                      className="h-8 text-xs rounded-lg border-slate-200 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Footer Thank You Note</Label>
                    <Input
                      value={footerMessage}
                      onChange={(e) => setFooterMessage(e.target.value)}
                      placeholder="Thank you for visiting! Please visit again."
                      className="h-8 text-xs rounded-lg border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Terms & Policy Note (Printed at Bottom)</Label>
                  <Textarea
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="Goods once sold or services rendered will not be refunded."
                    rows={2}
                    className="text-xs rounded-lg border-slate-200 resize-none"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={showStylist}
                      onChange={(e) => setShowStylist(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-xs text-slate-800">Print Assigned Stylist on Receipt</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={showGstBreakdown}
                      onChange={(e) => setShowGstBreakdown(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-xs text-slate-800">Print CGST + SGST Split Breakdown</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Live Thermal Receipt Preview (5 Columns) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-slate-900 rounded-2xl p-4 shadow-xl text-white sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Live Thermal Receipt Preview
                </h3>
              </div>
              <Badge className="bg-slate-800 text-slate-300 text-[10px] font-mono border-slate-700">
                {paperSize === "58mm" ? "58mm Thermal" : "80mm Thermal"}
              </Badge>
            </div>

            {/* Thermal Receipt Paper Mockup */}
            <div className="mt-3.5 bg-white text-slate-900 rounded-lg p-3.5 font-mono text-[11px] shadow-inner border border-slate-300 space-y-2">
              {/* Header: Logo + Salon Name */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-8 mx-auto object-contain mb-1" />
                )}
                <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 leading-tight">
                  {companyName || "YOUR SALON NAME"}
                </h4>
                {tagline && <p className="text-[9px] text-slate-500 italic">{tagline}</p>}
                {address && <p className="text-[10px] text-slate-600 leading-tight">{address}</p>}
                {phoneNumber && <p className="text-[10px] text-slate-600">Tel: {phoneNumber}</p>}
                {gstNumber && (
                  <p className="text-[10px] font-bold text-slate-800">
                    GSTIN: {gstNumber}
                  </p>
                )}
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 pt-1">
                  *** {receiptTitle || "TAX INVOICE"} ***
                </p>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-0.5 text-[10px] pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Inv #: INV-10842</span>
                  <span>Date: 25 Oct 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Client: Priya Sharma</span>
                  <span>Time: 02:45 PM</span>
                </div>
                {showStylist && (
                  <div className="flex justify-between">
                    <span>Stylist: Rahul Verma</span>
                    <span>Status: PAID</span>
                  </div>
                )}
              </div>

              {/* Items Table Mockup */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-300 text-[10px]">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-0.5">
                  <span className="w-1/2">Item</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/3 text-right">Amount</span>
                </div>
                <div className="flex justify-between">
                  <span className="w-1/2 truncate font-medium">Tail Haircut & Styling</span>
                  <span className="w-1/6 text-center">1</span>
                  <span className="w-1/3 text-right font-bold">₹500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="w-1/2 truncate font-medium">Face Massage & Glow</span>
                  <span className="w-1/6 text-center">1</span>
                  <span className="w-1/3 text-right font-bold">₹400.00</span>
                </div>
              </div>

              {/* Totals & GST Mockup */}
              <div className="space-y-0.5 text-[10px] pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹900.00</span>
                </div>
                {gstEnabled && (
                  <>
                    {showGstBreakdown ? (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST ({(Number(defaultGstRate) / 2).toFixed(1)}%):</span>
                          <span>₹{((900 * Number(defaultGstRate)) / 200).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST ({(Number(defaultGstRate) / 2).toFixed(1)}%):</span>
                          <span>₹{((900 * Number(defaultGstRate)) / 200).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-slate-600">
                        <span>GST ({defaultGstRate}%):</span>
                        <span>₹{((900 * Number(defaultGstRate)) / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between font-black text-xs text-slate-900 pt-1 border-t border-slate-300 mt-1">
                  <span>TOTAL PAYABLE:</span>
                  <span>
                    ₹
                    {(
                      900 +
                      (gstEnabled ? (900 * Number(defaultGstRate)) / 100 : 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Mode Mockup (Single or Split) */}
              <div className="space-y-0.5 text-[10px] pb-2 border-b border-dashed border-slate-300">
                <p className="font-bold">Payment Mode: Split Payment</p>
                <div className="flex justify-between text-slate-600 pl-2">
                  <span>• Cash Received:</span>
                  <span>₹500.00</span>
                </div>
                <div className="flex justify-between text-slate-600 pl-2">
                  <span>• UPI Paid:</span>
                  <span>
                    ₹
                    {(
                      400 +
                      (gstEnabled ? (900 * Number(defaultGstRate)) / 100 : 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-1 text-[9px] text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-800">{footerMessage}</p>
                <p className="text-[8px] leading-tight text-slate-400">{termsAndConditions}</p>
                <p className="text-[8px] text-slate-400 pt-1">
                  Printed via {printerType === "bluetooth" ? "Bluetooth ESC/POS" : "USB Thermal Printer"}
                </p>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-[11px] text-slate-400">
                Real-time preview of your live bills
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
