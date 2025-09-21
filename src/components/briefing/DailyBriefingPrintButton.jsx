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
    margin: 0.3,
    filename: `daily_briefing_${new Date().toISOString().split("T")[0]}.pdf`,
    html2canvas: {
      scale: 3,           // 🔍 Better quality rendering
      useCORS: true,
      logging: false,
    },
    jsPDF: {
      unit: "in",
      format: "letter",
      orientation: "portrait",
    },
    pagebreak: {          // 🔽 Prevent broken cards mid-page
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
