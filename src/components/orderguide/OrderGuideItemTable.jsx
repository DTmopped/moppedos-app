import React from 'react';
import { useData } from '@/contexts/DataContext';
+import { updateParLevel, updateOnHand } from '@/lib/orderGuideApi';
import { AlertTriangle, HelpCircle } from 'lucide-react';

-const OrderGuideItemTable = ({ items = [], categoryTitle }) => {
+const OrderGuideItemTable = ({ items = [], categoryTitle, locationId, onRefresh }) => {
  const {
    manualAdditions,
    setManualAdditions,
    isAdminMode,
    setGuideData,
    guideData
  } = useData();

  const filteredItems = items.filter(item => item.name !== categoryTitle);

+ const handleParBlur = async (e, row) => {
+   if (!isAdminMode || !row?.item_id || !locationId) return;
+   const val = Number(e.target.value);
+   if (!Number.isFinite(val)) return;
+   try {
+     await updateParLevel({ item_id: row.item_id, location_id: locationId, par_level: val });
+     await onRefresh?.();
+   } catch (err) {
+     console.error('Failed to update PAR:', err);
+     // optionally toast
+   }
+ };
+
+ const handleOnHandBlur = async (e, row) => {
+   if (!isAdminMode || !row?.item_id || !locationId) return;
+   const val = Number(e.target.value);
+   if (!Number.isFinite(val)) return;
+   try {
+     await updateOnHand({ item_id: row.item_id, location_id: locationId, on_hand: val });
+     await onRefresh?.();
+   } catch (err) {
+     console.error('Failed to update on-hand:', err);
+   }
+ };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Item</th>
-           <th className="text-left px-4 py-2 font-semibold">Forecast</th>
-           <th className="text-left px-4 py-2 font-semibold">Actual</th>
+           <th className="text-left px-4 py-2 font-semibold">PAR</th>
+           <th className="text-left px-4 py-2 font-semibold">On hand</th>
            <th className="text-left px-4 py-2 font-semibold">Variance</th>
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
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap bg-yellow-50">
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

                {/* PAR (forecast) */}
                <td className="px-4 py-2 bg-yellow-50">
                  <input
                    type="number"
                    className={`w-24 rounded border border-gray-300 px-2 py-1 text-right ${
                      !isAdminMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={item.forecast}
                    readOnly={!isAdminMode}
+                   onBlur={(e) => handleParBlur(e, item)}
                    onChange={() => {}}
                  />
                </td>

                {/* On hand (actual) */}
                <td className="px-3 py-2 bg-yellow-50">
                  <input
                    type="number"
                    className={`w-24 rounded border border-gray-300 px-2 py-1 text-right ${
                      !isAdminMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={item.actual}
                    readOnly={!isAdminMode}
+                   onBlur={(e) => handleOnHandBlur(e, item)}
                    onChange={() => {}}
                  />
                </td>

                <td className="px-3 py-2 bg-yellow-50">{item.variance}</td>
                <td className="px-3 py-2 bg-yellow-50">{item.unit}</td>

                <td className="px-3 py-2 bg-yellow-50">
                  {status}
                </td>

                {isAdminMode && (
                  <td className="px-3 py-2 bg-yellow-50">
                    <span className="text-gray-400 text-xs italic">Auto</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderGuideItemTable;
