import React from "react";
import { Button } from "@/components/ui/button";

const DailyBriefingPrintButton = () => {
  const handlePrint = () => {
    if (typeof window === "undefined" || !window.html2pdf) {
      alert("PDF library not loaded.");
      return;
    }

    const element = document.getElementById("briefing-content");
    if (element) {
      window.html2pdf()
        .from(element)
        .set({
          margin: 0.5,
          filename: `daily_briefing_${new Date().toISOString().split("T")[0]}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .save();
    } else {
      alert("No content found to print.");
    }
  };

  return (
    <Button onClick={handlePrint} className="mt-4">
      🖨️ Generate PDF
    </Button>
  );
};

export default DailyBriefingPrintButton;
