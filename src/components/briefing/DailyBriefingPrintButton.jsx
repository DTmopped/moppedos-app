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

    // Force fixed width to match PDF output (important for Tailwind layouts)
    element.style.width = "816px"; // 8.5 inches at 96dpi = 816px
    element.style.padding = "24px"; // for nice margins in PDF

    // In DailyBriefingPrintButton.jsx

const opt = {
  margin: [0.5, 0.5], // Margin in inches [top, left, bottom, right] - better than 0
  filename: `daily_briefing_${new Date().toISOString().split("T")[0]}.pdf`,
  image: { type: 'jpeg', quality: 0.98 }, // Explicitly set image quality
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    dpi: 192, // Increase DPI for better quality
    letterRendering: true,
  },
  jsPDF: {
    unit: "in", // Use inches for margin consistency
    format: "letter",
    orientation: "portrait",
    hotfixes: ["px_scaling"], // ✅ CRITICAL FIX: Helps with modern CSS units
  },
  // The pagebreak option is good, we'll keep it.
  pagebreak: {
    mode: ["avoid-all", "css", "legacy"],
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
