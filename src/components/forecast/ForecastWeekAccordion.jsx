import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ForecastWeekAccordion = ({ week, isInitiallyOpen }) => {
  const totalSales = week.results.find(r => r.isTotal)?.sales || 0;

  return (
    <Accordion type="single" collapsible defaultValue={isInitiallyOpen ? "item-1" : undefined}>
      <AccordionItem value="item-1" className="border bg-white rounded-lg mb-2 shadow-sm">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-800 hover:no-underline">
          Week of: {new Date(week.startDate).toLocaleDateString()} (Total Sales: ${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })})
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2 bg-gray-50">
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
                {week.results.map((row, index) => (
                  <TableRow key={index} className={`border-t ${row.isTotal ? "bg-gray-200 font-bold" : "hover:bg-gray-100"}`}>
                    <TableCell className="font-medium">{row.day}</TableCell>
                    <TableCell className="text-right">{row.pax?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.guests?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">{row.amGuests !== undefined ? `${row.amGuests}/${row.pmGuests}` : '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">${row.sales?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">${row.food?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">${row.bev?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">${row.labor?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ForecastWeekAccordion;


