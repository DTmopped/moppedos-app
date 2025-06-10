import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './AppLayout'; 
import { views } from '@/config/views';

const AppRouterComponent = () => {
  const defaultViewPath = views.find(v => v.isDefault)?.path || views[0]?.path || "/";

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to={defaultViewPath} replace />} />
          {views.map((view) => (
            <Route key={view.id} path={view.path} element={null} />
          ))}
          <Route path="*" element={<Navigate to={defaultViewPath} replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouterComponent;
