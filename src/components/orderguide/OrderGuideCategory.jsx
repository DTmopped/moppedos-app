import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table.jsx";

import { cn } from '@/lib/utils'; // For conditional class names
const OrderGuideCategoryComponent = ({ categoryTitle, items, getStatusClass, getStatusIcon, icon: Icon }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="glassmorphic-card mb-6 shadow-lg card-hover-glow">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold flex items-center text-primary dark:text-sky-400">
          {Icon && <Icon size={28} className="mr-3 text-primary dark:text-sky-400 no-print" />}
          {categoryTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5 px-3 py-2">Item</TableHead>
                <TableHead className="text-right px-3 py-2">Forecasted</TableHead>
                <TableHead className="text-right px-3 py-2">Actual</TableHead>
                <TableHead className="text-right px-3 py-2">Variance</TableHead>
                <TableHead className="px-3 py-2">Unit</TableHead>
                <TableHead className="text-center w-[50px] no-print px-3 py-2">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(([name, forecast, unit, actual, variance], index) => {
                const rowStatusClass = typeof forecast === 'number' && typeof actual === 'number' ? getStatusClass(forecast, actual) : 'bg-opacity-10 dark:bg-opacity-20';
                return (
                  <TableRow key={`${categoryTitle}-${name}-${index}`} className={cn("hover:bg-slate-800/30 transition-colors duration-150", rowStatusClass)}>
                    <TableCell className="font-medium px-3 py-2.5 tabular-nums">{name}</TableCell>
                    <TableCell className="text-right px-3 py-2.5 tabular-nums">{typeof forecast === 'number' ? forecast.toLocaleString() : forecast}</TableCell>
                    <TableCell className="text-right px-3 py-2.5 tabular-nums">{typeof actual === 'number' ? actual.toLocaleString() : (actual || "-")}</TableCell>
                    <TableCell className="text-right px-3 py-2.5 tabular-nums">{variance}</TableCell>
                    <TableCell className="px-3 py-2.5">{unit}</TableCell>
                    <TableCell className="text-center no-print px-3 py-2.5 tabular-nums">
                      {typeof forecast === 'number' && typeof actual === 'number' ? getStatusIcon(forecast, actual) : getStatusIcon(0,0) /* Provide default for non-numeric */}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderGuideCategoryComponent;
