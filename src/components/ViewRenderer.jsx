import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';



const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full w-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Map your component names to their lazy-loaded imports
const componentImportMap = {
  FvaDashboard: lazy(() => import('./FvaDashboard.jsx')),
  WeeklyForecastParser: lazy(() => import('./WeeklyForecastParser.jsx')),
  DailyShiftPrepGuide: lazy(() => import('./DailyShiftPrepGuide.jsx')),
  WeeklyLaborSchedule: lazy(() => import('./WeeklyLaborSchedule.jsx')),
  WeeklyOrderGuide: lazy(() => import('./WeeklyOrderGuide.jsx')),
  DailyBriefingBuilder: lazy(() => import('./DailyBriefingBuilder.jsx')),
  ForecastCenter: lazy(() => import('./ForecastEmailParserBot.jsx')), // Use the correct path to your new file
  SmartPrepGuide: lazy(() => import('./SmartPrepGuide.jsx')),
  LaborManagement: lazy(() => import('../pages/LaborManagement.jsx')),
  // ✅ ADD THIS LINE: Order Guide Test component
 InventoryManagement: lazy(() => import('./OrderGuideTest.jsx')),
  AIOrderDashboard: lazy(() => import('./orderguide/AIOrderDashboard.jsx')),

};

const ViewRenderer = ({ viewsConfig }) => {
  const location = useLocation();

  if (!viewsConfig || viewsConfig.length === 0) {
    return <div className="text-red-500 p-4">Error: Views configuration is missing or empty.</div>;
  }

  // Try to match the current URL path
  let viewToRender = viewsConfig.find(v => v.path === location.pathname);

  // If not found, show a graceful 404
  if (!viewToRender) {
    console.warn("No matching view for:", location.pathname);
    return (
      <div className="p-8 text-center text-slate-300">
        <h2 className="text-xl font-bold mb-2">404 - Page Not Found</h2>
        <p className="text-slate-400">No matching view for: <code>{location.pathname}</code></p>
      </div>
    );
  }

  const componentName = viewToRender.componentName;

  if (typeof componentName !== 'string') {
    console.error("Invalid componentName:", componentName, "for view:", viewToRender);
    return <div className="text-red-500 p-4">Error: Invalid component configuration. Check console.</div>;
  }

  const Component = componentImportMap[componentName];

  if (!Component) {
    console.error(`Missing import for component: ${componentName}`);
    return <div className="text-red-500 p-4">Error: Component not found for {componentName}. Check console.</div>;
  }

  console.log("Rendering view:", componentName, "for path:", location.pathname);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

export default ViewRenderer;
