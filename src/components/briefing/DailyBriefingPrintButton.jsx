import React from "react";
import { Button } from "@/components/ui/button";

const DailyBriefingPrintButton = () => {
  const handlePrint = () => {
    if (typeof window === "undefined" || !window.html2pdf) {
      alert("PDF library not loaded.");
      return;
    }

    const element = document.getElementById("briefing-content");
    if (!element) {
      alert("No content found to print.");
      return;
    }

    const opt = {
      margin: 0.5,
      filename: `daily_briefing_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3, // 🔍 Higher DPI for better quality
        useCORS: true,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ['avoid-all'], // 🧠 Prevent mid-section breaks
        before: '.page-break', // Optional: for forcing breaks
      },
    };

    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <Button onClick={handlePrint} className="mt-4">
      🖨️ Generate PDF
    </Button>
  );
};

export default DailyBriefingPrintButton;
