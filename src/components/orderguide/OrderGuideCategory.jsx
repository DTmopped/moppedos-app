import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table.jsx";
import { cn } from "@/lib/utils";

const OrderGuideCategory = ({ ... }) => {
  categoryTitle,
  items,
  getStatusClass,
  getStatusIcon
}) => {
  const isValidArray = Array.isArray(items);

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
        {isValidArray ? (
          items.map((item, index) => {
            const { name, forecast, unit, actual, variance } = item;

            return (
              <TableRow
                key={index}
                className={cn(
                  typeof getStatusClass === 'function' ? getStatusClass(item) : ''
                )}
              >
                <TableCell className="font-medium flex items-center gap-2">
                  {typeof getStatusIcon === 'function' ? getStatusIcon(item) : null} {name}
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
          })
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-red-500 text-sm text-center">
              ⚠️ Error: Invalid data for this category. Expected an array, got {typeof items}.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default OrderGuideCategory;
