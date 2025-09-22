// src/components/forecast/ForecastWeekAccordion.jsx
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table.jsx";
import { ChevronDown } from 'lucide-react';

// A simplified table just for the accordion content
const AccordionTable = ({ weekData }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Day</TableHead>
        <TableHead className="text-right">Sales</TableHead>
        <TableHead className="text-right">Guests</TableHead>
        <TableHead className="text-right">Pax</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {weekData.map((row, idx) => (
        <TableRow key={idx} className={row.isTotal ? "font-bold bg-slate-700/50" : ""}>
          <TableCell>{row.day}</TableCell>
          <TableCell className="text-right">${row.sales.toLocaleString()}</TableCell>
          <TableCell className="text-right">{row.guests.toLocaleString()}</TableCell>
          <TableCell className="text-right">{row.pax.toLocaleString()}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const ForecastWeekAccordion = ({ week, isInitiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  const totalSales = week.results.find(r => r.isTotal)?.sales || 0;
  const weekLabel = `Week of: ${new Date(week.startDate).toLocaleDateString()} (Total Sales: $${totalSales.toLocaleString()})`;

  return (
    <div className="border border-slate-700 rounded-lg bg-slate-800/50 mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 text-left flex justify-between items-center hover:bg-slate-700/50"
      >
        <span className="font-semibold text-slate-200">{weekLabel}</span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="p-2 bg-slate-900/50">
          <AccordionTable weekData={week.results} />
        </div>
      )}
    </div>
  );
};

export default ForecastWeekAccordion;
