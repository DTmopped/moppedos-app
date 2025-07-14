import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "components/ui/table.jsx";
import { cn } from "@/lib/utils";

const OrderGuideItemTable = ({ items, getStatusClass }) => {
  // 🛡️ Defensive check for the function
  const safeGetStatusClass = typeof getStatusClass === 'function'
    ? getStatusClass
    : () => ''; // return empty string if not a function

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
        {items.map(({ name, forecast, unit, actual, variance }, index) => (
          <TableRow
            key={index}
            className={cn(
              safeGetStatusClass({ name, forecast, unit, actual, variance })
            )}
          >
            <TableCell className="font-medium">{name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {`${forecast} ${unit}`}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {actual !== undefined && actual !== null ? `${actual} ${unit}` : '-'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {variance !== undefined && variance !== null ? variance : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrderGuideItemTable;
