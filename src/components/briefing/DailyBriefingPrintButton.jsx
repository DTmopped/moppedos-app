import React, { useEffect, useState } from "react";

// Only run on client
const isClient = typeof window !== "undefined";

const DailyBriefingPrintButton = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isClient) {
      setIsReady(true);
    }
  }, []);

  const handlePrint = async () => {
    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.getElementById("briefing-content");
    if (!element) {
      alert("Briefing content not found.");
      return;
    }

    const opt = {
      margin: 0.5,
      filename: `DailyBriefing_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!isReady) return null;

  return (
    <button
      onClick={handlePrint}
      className="bg-black text-white px-4 py-2 rounded-md shadow hover:bg-gray-800"
    >
      🖨️ Generate PDF
    </button>
  );
};

export default DailyBriefingPrintButton;
