import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full w-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const componentImportMap = {
  FvaDashboard: lazy(() => import('./FvaDashboard.jsx')),
  WeeklyForecastParser: lazy(() => import('./WeeklyForecastParser.jsx')),
  DailyShiftPrepGuide: lazy(() => import('./DailyShiftPrepGuide.jsx')),
  WeeklyLaborSchedule: lazy(() => import('./WeeklyLaborSchedule.jsx')),
  WeeklyOrderGuide: lazy(() => import('./WeeklyOrderGuide.jsx')),
  DailyBriefingBuilder: lazy(() => import('./DailyBriefingBuilder.jsx')),
};


const ViewRenderer = ({ viewsConfig }) => {
  const location = useLocation();

  if (!viewsConfig || viewsConfig.length === 0) {
    return <div className="text-red-500 p-4">Error: Views configuration is missing or empty.</div>;
  }

  let viewToRender = viewsConfig.find(v => v.path === location.pathname);

  if (!viewToRender) {
    viewToRender = viewsConfig.find(v => v.isDefault) || viewsConfig[0];
    if (!viewToRender) {
      return <div className="text-red-500 p-4">Error: View not found and no default view configured.</div>;
    }
  }

  const componentName = viewToRender.componentName;
  let cleanedComponentName = componentName;

  if (typeof componentName === 'string' && componentName.endsWith('.jsx')) {
    cleanedComponentName = componentName.slice(0, -4);
  } else if (typeof componentName !== 'string') {
    console.error("Invalid componentName:", componentName, "for view:", viewToRender);
    return <div className="text-red-500 p-4">Error: Invalid component configuration. Check console.</div>;
  }

  const Component = componentImportMap[cleanedComponentName];
  if (!Component) {
    console.error(`Missing import for component: ${cleanedComponentName}`);
    return <div className="text-red-500 p-4">Error: Component not found for {cleanedComponentName}. Check console.</div>;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

export default ViewRenderer;
