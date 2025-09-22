import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ForecastWeekAccordion = ({ week, isOpen, onToggle }) => {
  const totalSales = week.results.find(r => r.isTotal)?.sales || 0;
  const accordionValue = week.startDate; // Use the unique start date as the value

  return (
    // The Accordion's value is now controlled by the parent's state.
    // onValueChange calls the onToggle function passed from the parent.
    <Accordion type="single" collapsible value={isOpen ? accordionValue : ""} onValueChange={onToggle}>
      <AccordionItem value={accordionValue} className="border-none mb-4">
        <div className="bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
          <AccordionTrigger className="px-6 py-4 text-base font-medium text-gray-900 hover:no-underline rounded-t-lg data-[state=open]:rounded-b-none">
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
                    <TableHead className="py-3 px-4 font-semibold text-gray-600">Day</TableHead>
                    <TableHead className="py-3 px-4 text-right font-semibold text-gray-600">Pax</TableHead>
                    <TableHead className="py-3 px-4 text-right font-semibold text-gray-600">Guests</TableHead>
                    <TableHead className="py-3 px-4 text-right font-semibold text-gray-600">AM/PM</TableHead>
                    <TableHead className="py-3 px-4 text-right font-semibold text-gray-600">Sales</TableHead>
                    <TableHead className="py-3 px-4 text-right font-semibold text-gray-600">Food</TableHead>
                    <TableHead className="py-3 px-4 text-right font-semibold text-gray-600">Bev</TableHead>
                    <TableHead className="py-3 px-4 text-right font-semibold text-gray-600">Labor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {week.results.map((row, index) => (
                    <TableRow key={index} className={`border-0 ${row.isTotal ? "bg-slate-100 font-bold" : "hover:bg-gray-50"}`}>
                      <TableCell className="py-3 px-4 font-medium">{row.day}</TableCell>
                      <TableCell className="py-3 px-4 text-right">{row.pax?.toLocaleString()}</TableCell>
                      <TableCell className="py-3 px-4 text-right">{row.guests?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="py-3 px-4 text-right">{row.amGuests !== undefined ? `${row.amGuests}/${row.pmGuests}` : '—'}</TableCell>
                      <TableCell className="py-3 px-4 text-right font-semibold text-green-700">${row.sales?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="py-3 px-4 text-right">${row.food?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="py-3 px-4 text-right">${row.bev?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="py-3 px-4 text-right">${row.labor?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default ForecastWeekAccordion;




