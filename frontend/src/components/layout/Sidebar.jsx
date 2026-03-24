import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { label: 'Dashboard', icon: HomeIcon, to: '/', roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { label: 'Resources', icon: BuildingOfficeIcon, to: '/resources', roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { label: 'My Bookings', icon: CalendarIcon, to: '/bookings', roles: ['USER', 'ADMIN'] },
  { label: 'Incident Tickets', icon: WrenchScrewdriverIcon, to: '/tickets', roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
];

const adminItems = [
  { label: 'All Bookings', icon: CalendarIcon, to: '/admin/bookings', roles: ['ADMIN'] },
  { label: 'All Tickets', icon: WrenchScrewdriverIcon, to: '/admin/tickets', roles: ['ADMIN', 'TECHNICIAN'] },
  { label: 'Manage Users', icon: UsersIcon, to: '/admin/users', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user, logout, isAdmin, isTechnician } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleAdmin = adminItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🎓 Smart Campus</h1>
        <p>Operations Hub</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map((item) => (
          item.roles.includes(user?.role) && (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon />
              {item.label}
            </NavLink>
          )
        ))}

        {(isAdmin || isTechnician) && visibleAdmin.length > 0 && (
          <>
            <div className="nav-section-label" style={{ marginTop: '1rem' }}>Administration</div>
            {visibleAdmin.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--white)' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
            {user?.email}
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            <span className={`badge badge-${user?.role?.toLowerCase()}`}>
              {user?.role}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary w-full" onClick={handleLogout}>
          <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} />
          Logout
        </button>
      </div>
    </aside>
  );
}
