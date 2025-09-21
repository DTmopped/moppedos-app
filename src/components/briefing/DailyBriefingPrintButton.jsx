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

    const opt = {
      margin: 0,
      filename: `daily_briefing_${new Date().toISOString().split("T")[0]}.pdf`,
      html2canvas: {
        scale: 2,           // Adjusted to balance quality & performance
        useCORS: true,
        logging: false,
        windowWidth: 1200,  // helps preserve responsive styles
      },
      jsPDF: {
        unit: "pt",
        format: "letter",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        before: ".pagebreak", // Optional manual control
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
