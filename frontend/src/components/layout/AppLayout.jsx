import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/': 'Dashboard',
  '/resources': 'Facilities & Resources',
  '/bookings': 'My Bookings',
  '/tickets': 'Incident Tickets',
  '/admin/bookings': 'All Bookings',
  '/admin/tickets': 'All Tickets',
  '/admin/users': 'Manage Users',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'Smart Campus';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ marginLeft: 260 }}>
        <Header title={title} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
