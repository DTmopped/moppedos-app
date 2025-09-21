import React from "react";
import { Button } from "@/components/ui/button";

const DailyBriefingPrintButton = () => {
  const handlePrint = async () => {
    if (typeof window === "undefined") return;

    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.getElementById("briefing-content");
    if (element) {
      html2pdf().from(element).set({
        margin: 0.5,
        filename: `daily_briefing_${new Date().toISOString().split("T")[0]}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      }).save();
    } else {
      alert("Could not find content to print.");
    }
  };

  return (
    <Button onClick={handlePrint} variant="default" className="mt-4">
      🖨️ Generate PDF
    </Button>
  );
};

export default DailyBriefingPrintButton;
