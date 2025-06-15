import React from "react";

const DailyShiftPrepGuideHeader = ({ title, totalGuests, amGuests, pmGuests }) => {
  return (
    <div className="mb-6 border-b border-slate-600 pb-4">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground">
        <span className="mr-4">Total Guests: {totalGuests?.toLocaleString()}</span>
        <span className="mr-4">AM: {amGuests?.toLocaleString()}</span>
        <span>PM: {pmGuests?.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default DailyShiftPrepGuideHeader;
