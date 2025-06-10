import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const DayPrepCard = ({ dayData, onPrepTaskChange }) => {
  if (!dayData) return null;

  const handleAssignmentChange = (shiftKey, itemId, value) => {
    onPrepTaskChange(dayData.date, shiftKey, itemId, 'assignedTo', value);
  };

  const handleCompletionChange = (shiftKey, itemId, checked) => {
    onPrepTaskChange(dayData.date, shiftKey, itemId, 'completed', checked);
  };

  const getFallbackDisplayText = (item) => {
    let displayText = "General Task";
    if (item?.originalString?.includes(':')) {
      const parts = item.originalString.split(':', 2);
      const detail = parts[1]?.trim();
      if (detail) {
        displayText = detail;
      } else if (parts[0].trim().toLowerCase() !== item.name.toLowerCase()) {
        displayText = parts[0].trim();
      }
    }
    return displayText;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glassmorphic-card no-print card-hover-glow">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-lime-500">
            {new Date(dayData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            <span className="text-sm font-normal text-muted-foreground ml-2">(Adj. Guests: {dayData.totalGuests.toFixed(0)})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(dayData.shifts).map(([shiftKey, shiftInfo]) => (
            <div key={shiftKey} className="border-t border-border/30 pt-4">
              <h4 className={cn("flex items-center text-lg font-medium mb-3", shiftInfo.color || "text-foreground")}>
                {shiftInfo.icon}
                {shiftInfo.name} Prep
              </h4>
              {shiftInfo.prepItems?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Item</TableHead>
                        <TableHead className="w-[80px] px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Qty</TableHead>
                        <TableHead className="w-[70px] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Unit</TableHead>
                        <TableHead className="w-[120px] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Assigned To</TableHead>
                        <TableHead className="w-[60px] px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Done</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shiftInfo.prepItems.map((item) => {
                        const fallbackText = getFallbackDisplayText(item);
                        let displayQuantity = item?.quantity?.toString().trim() || "N/A";

                        let displayUnit = (typeof item.unit === 'string' && item.unit.trim()) ? item.unit
                          : (typeof item.unit === 'number') ? String(item.unit)
                          : (displayQuantity !== "N/A" && displayQuantity !== "General Task") ? "" : fallbackText;

                        if (displayQuantity === "N/A" && displayUnit === fallbackText && fallbackText !== "General Task") {
                          displayQuantity = "";
                        }

                        return (
                          <TableRow key={item.id} className="hover:bg-muted/20 dark:hover:bg-slate-800/30 transition-colors">
                            <TableCell className="px-3 py-2.5 font-medium text-sm text-foreground truncate" title={item.name}>{item.name}</TableCell>
                            <TableCell className={cn("px-3 py-2.5 text-right text-sm", (displayQuantity === "N/A" || displayQuantity === "") ? "text-muted-foreground italic" : "text-primary font-semibold")}>
                              {displayQuantity}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-left text-xs text-muted-foreground">{displayUnit}</TableCell>
                            <TableCell className="px-3 py-2">
                              <Input
                                type="text"
                                placeholder="Assign"
                                value={item.assignedTo}
                                onChange={(e) => handleAssignmentChange(shiftKey, item.id, e.target.value)}
                                className="h-8 text-xs bg-background/50 border-border/50 focus:ring-primary/50 input-enhanced"
                              />
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-center">
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  id={`completed-${dayData.date}-${shiftKey}-${item.id}`}
                                  checked={item.completed}
                                  onCheckedChange={(checked) => handleCompletionChange(shiftKey, item.id, checked)}
                                  className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                                <Label htmlFor={`completed-${dayData.date}-${shiftKey}-${item.id}`} className="sr-only">Done</Label>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic px-3 py-2">No prep items defined for this shift.</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DayPrepCard;
