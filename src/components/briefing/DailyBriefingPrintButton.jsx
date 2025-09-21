import React from "react";
import { Button } from "@/components/ui/button";

const DailyBriefingPrintButton = () => {
  const handlePrint = () => {
    // 1. Check if the html2pdf library is loaded on the window object.
    if (typeof window === "undefined" || !window.html2pdf) {
      alert("PDF generation library is not available.");
      return;
    }

    // 2. Find the hidden element that contains the printable content.
    const element = document.getElementById("briefing-content");
    if (!element) {
      alert("Printable content not found. Cannot generate PDF.");
      return;
    }

    // 3. Define the robust options for the PDF generator.
    const opt = {
      margin: [0.5, 0.5], // Margin in inches [top/bottom, left/right]
      filename: `daily_briefing_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        dpi: 192,
        letterRendering: true,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
        hotfixes: ["px_scaling"], // CRITICAL: Helps render modern CSS layouts correctly.
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"], // Helps prevent elements from being cut in half.
      },
    };

    // 4. Run the PDF generation process.
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <Button onClick={handlePrint}>
      🖨️ Generate PDF
    </Button>
  );
};

export default DailyBriefingPrintButton;

