// components/DailyBriefingPrintButton.jsx
import React from "react";
import html2pdf from "html2pdf.js";

const DailyBriefingPrintButton = ({ elementId = "briefing-content" }) => {
  const handlePrint = () => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Printable element not found");
      return;
    }

    const opt = {
      margin: 0.5,
      filename: `Mopped_Daily_Briefing_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <button
      onClick={handlePrint}
      className="bg-black text-white px-4 py-2 rounded-md shadow hover:bg-gray-800 transition"
    >
      🖨️ Generate PDF
    </button>
  );
};

export default DailyBriefingPrintButton;
