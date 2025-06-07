import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table.jsx";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const PerformanceLogTable = ({ logData }) => {
  const getPercentageClass = (pct, target) => {
    if (pct === 0 && target === 0) return "text-muted-foreground"; 
    return pct > target ? "text-red-500 font-semibold bg-red-500/10 px-1 py-0.5 rounded" : "text-green-500 bg-green-500/10 px-1 py-0.5 rounded";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glassmorphic-card card-hover-glow mt-6">
        <CardHeader>
          <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Performance Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border/50 shadow-inner">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="min-w-[100px] text-foreground">Date</TableHead>
                  <TableHead className="text-right min-w-[120px] text-foreground">Sales (F/A)</TableHead>
                  <TableHead className="text-right min-w-[120px] text-foreground">Food (F/A)</TableHead>
                  <TableHead className="text-right min-w-[120px] text-foreground">Bev (F/A)</TableHead>
                  <TableHead className="text-right min-w-[120px] text-foreground">Labor (F/A)</TableHead>
                  <TableHead className="text-right min-w-[80px] text-foreground">Food %</TableHead>
                  <TableHead className="text-right min-w-[80px] text-foreground">Bev %</TableHead>
                  <TableHead className="text-right min-w-[80px] text-foreground">Labor %</TableHead>
                  <TableHead className="min-w-[150px] text-foreground">Alerts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logData.map((row, index) => (
                  <motion.tr 
                    key={row.date + index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
                  >
                    <TableCell className="font-medium text-foreground">{row.date}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.salesF.toFixed(0)} / {row.salesA.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.foodF.toFixed(0)} / {row.foodA.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.bevF.toFixed(0)} / {row.bevA.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.labF.toFixed(0)} / {row.labA.toFixed(0)}</TableCell>
                    <TableCell className={`text-right ${getPercentageClass(row.foodPct, 30)}`}>{row.foodPct.toFixed(1)}%</TableCell>
                    <TableCell className={`text-right ${getPercentageClass(row.bevPct, 20)}`}>{row.bevPct.toFixed(1)}%</TableCell>
                    <TableCell className={`text-right ${getPercentageClass(row.labPct, 14)}`}>{row.labPct.toFixed(1)}%</TableCell>
                    <TableCell>
                      {row.alerts.length === 0 ? (
                        <span className="flex items-center text-green-500">
                          <CheckCircle2 size={16} className="mr-1" /> All Good
                        </span>
                      ) : (
                        row.alerts.map((alert, i) => (
                          <span key={i} className="flex items-center text-red-500 mb-1 last:mb-0">
                            <AlertTriangle size={16} className="mr-1" /> {alert.text}
                          </span>
                        ))
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PerformanceLogTable;
