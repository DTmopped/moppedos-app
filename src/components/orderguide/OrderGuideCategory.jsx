import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { cn } from "@/lib/utils";

const OrderGuideCategoryComponent = ({ categoryTitle, items, getStatusClass, getStatusIcon }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Item</TableHead>
          <TableHead className="text-right">Forecasted</TableHead>
          <TableHead className="text-right">Actual</TableHead>
          <TableHead className="text-right">Variance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => {
          const { name, forecast, unit, actual, variance } = item;

          return (
            <TableRow key={index} className={cn(getStatusClass(item))}>
              <TableCell className="font-medium flex items-center gap-2">
                {getStatusIcon(item)} {name}
              </TableCell>
              <TableCell className="text-right tabular-nums">{`${forecast} ${unit}`}</TableCell>
              <TableCell className="text-right tabular-nums">
                {actual !== undefined && actual !== null ? `${actual} ${unit}` : '-'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {variance !== undefined && variance !== null ? variance : '-'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default OrderGuideCategoryComponent;
