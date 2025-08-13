// src/components/orderguide/OrderGuideItemTable.jsx
import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { AlertTriangle, HelpCircle } from 'lucide-react';

const currency = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

const OrderGuideItemTable = ({
  items = [],
  categoryTitle,
  getStatusClass,
  getStatusIcon,
  isParCategory,
  locationId,
  onRefresh,
}) => {
  const { isAdminMode, manualAdditions, setManualAdditions, setGuideData, guideData } = useData();

  // You can wire the edge functions here later for on_hand/par updates.
  // For now we’re just displaying costs and totals.

  const filteredItems = Array.isArray(items)
    ? items.filter((it) => it?.name && it.name !== categoryTitle)
    : [];

  const categorySubtotal = useMemo(
    () =>
      filteredItems.reduce((sum, it) => {
        const n = Number(it.est_total ?? 0);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
    [filteredItems]
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Item</th>
            <th className="text-right px-4 py-2 font-semibold">On Hand</th>
            <th className="text-right px-4 py-2 font-semibold">PAR</th>
            <th className="text-right px-4 py-2 font-semibold">Variance</th>
            <th className="text-right px-4 py-2 font-semibold">Order Qty</th>
            <th className="text-right px-4 py-2 font-semibold">Unit Cost</th>
            <th className="text-right px-4 py-2 font-semibold">Est. $</th>
            <th className="text-left px-4 py-2 font-semibold">Unit</th>
            <th className="text-left px-4 py-2 font-semibold">Status</th>
            {isAdminMode && <th className="text-left px-4 py-2 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item, index) => {
            const name = item.name || 'Unnamed Item';
            const status = item.status?.trim().toLowerCase() || 'unknown';
            const isParItem = status === 'par item';
            const isCustom = status === 'custom';

            return (
              <tr key={index} className="border-b dark:border-gray-700">
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                  {name}
                  {isParItem && (
                    <span className="ml-2 inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      PAR Item
                    </span>
                  )}
                  {isCustom && (
                    <span className="ml-2 inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                      Custom
                    </span>
                  )}
                </td>

                <td className="px-4 py-2 text-right tabular-nums">{item.actual}</td>
                <td className="px-4 py-2 text-right tabular-nums">{item.forecast}</td>
                <td className="px-4 py-2 text-right tabular-nums">{item.variance}</td>
                <td className="px-4 py-2 text-right tabular-nums">{item.order_quantity ?? 0}</td>
                <td className="px-4 py-2 text-right tabular-nums">{currency(item.cost_per_unit)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">{currency(item.est_total)}</td>
                <td className="px-4 py-2">{item.unit}</td>

                <td className="px-4 py-2">
                  {status === 'par item' ? (
                    <span className="inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      <AlertTriangle className="w-3 h-3 mr-1 text-yellow-600" />
                      PAR Item
                    </span>
                  ) : (
                    <div className={`inline-flex items-center gap-1 ${getStatusClass?.(item) || ''}`}>
                      {getStatusIcon?.(item) ?? <HelpCircle className="w-3 h-3 text-slate-500" />}
                      <span className="text-xs capitalize">{status}</span>
                    </div>
                  )}
                </td>

                {isAdminMode && (
                  <td className="px-3 py-2">
                    <span className="text-gray-400 text-xs italic">Edit coming next</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <td className="px-4 py-2 font-semibold" colSpan={6}>Category Subtotal</td>
            <td className="px-4 py-2 text-right font-semibold">{currency(categorySubtotal)}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default OrderGuideItemTable;
