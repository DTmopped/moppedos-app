import React from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ForecastWeekAccordion = ({ week, amSplit }) => { 
  const totalSales = week.results.find(r => r.isTotal)?.sales || 0;

  return (
    // The AccordionItem is the main container for each week
    <AccordionItem value={week.startDate} className="border bg-white rounded-lg shadow-sm mb-2 transition-shadow hover:shadow-md">
      <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-800 hover:no-underline rounded-lg data-[state=open]:rounded-b-none">
        <div className="flex justify-between w-full items-center">
          <span>
            Week of: {new Date(week.startDate + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'numeric', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-gray-700 font-semibold">
            Total Sales: ${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 bg-gray-50 rounded-b-lg">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">Day</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Pax</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Guests</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">AM/PM</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Sales</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Food</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Bev</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Labor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {week.results.map((row, index) => {
                const amGuests = Math.round((row.guests || 0) * amSplit);
                const pmGuests = (row.guests || 0) - amGuests;

                return (
                  <TableRow key={index} className={`border-t ${row.isTotal ? "bg-gray-200 font-bold" : "hover:bg-gray-100"}`}>
                    <TableCell className="font-medium">{row.day}</TableCell>
                    <TableCell className="text-right">{row.pax?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.guests?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">{row.isTotal ? '—' : `${amGuests}/${pmGuests}`}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">${row.sales?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
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
    </AccordionItem>
  );
};

export default ForecastWeekAccordion;







