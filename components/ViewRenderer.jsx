import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full w-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
  
  const importPath = `../components/${cleanedComponentName}.jsx`;

  const Component = lazy(() => 
    import(importPath).catch(err => {
      console.error(`Failed to import component: ${cleanedComponentName} from path: ${importPath}`, err);
      console.error("View configuration that failed:", viewToRender);
      console.error("Full viewsConfig:", viewsConfig);
      return { 
        default: () => (
          <div className="text-red-500 p-4">
            Error loading component: {cleanedComponentName}. Check console for details.
          </div>
        )
      };
    })
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

export default ViewRenderer;
