import React from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// *** LOGIC FIX: amSplit is now a prop ***
const ForecastWeekAccordion = ({ week, amSplit }) => { 
  const totalSales = week.results.find(r => r.isTotal)?.sales || 0;

  return (
    <AccordionItem value={week.startDate} className="border-none">
      <div className="bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
        <AccordionTrigger className="px-6 py-4 text-base font-medium text-gray-900 hover:no-underline rounded-lg data-[state=open]:rounded-b-none">
          <div className="flex justify-between w-full items-center">
            <span>
              Week of: {new Date(week.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-gray-700 font-semibold">
              Total Sales: ${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 bg-white rounded-b-lg">
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-gray-50">
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Pax</TableHead>
                  <TableHead className="text-right">Guests</TableHead>
                  <TableHead className="text-right">AM/PM</TableHead> {/* It's back! */}
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Food</TableHead>

                  <TableHead className="text-right">Bev</TableHead>
                  <TableHead className="text-right">Labor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {week.results.map((row, index) => {
                  // *** LOGIC FIX: Calculate AM/PM guests on the fly ***
                  const amGuests = Math.round((row.guests || 0) * amSplit);
                  const pmGuests = (row.guests || 0) - amGuests;

                  return (
                    <TableRow key={index} className={`border-0 ${row.isTotal ? "bg-slate-100 font-bold" : "hover:bg-gray-50"}`}>
                      <TableCell className="font-medium">{row.day}</TableCell>
                      <TableCell className="text-right">{row.pax?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.guests?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      {/* Display the calculated split, or '—' for the total row */}
                      <TableCell className="text-right">{row.isTotal ? '—' : `${amGuests}/${pmGuests}`}</TableCell>
                      <TableCell className="text-right font-semibold text-green-700">${row.sales?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right">${row.food?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right">${row.bev?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right">${row.labor?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
};

export default ForecastWeekAccordion;






