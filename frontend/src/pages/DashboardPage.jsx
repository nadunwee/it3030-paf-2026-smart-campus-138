import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourceService, bookingService, ticketService } from '../services';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        <Icon />
      </div>
      <div className="stat-info">
        <h3>{label}</h3>
        <p>{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, isTechnician } = useAuth();
  const [stats, setStats] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, bookingsRes, ticketsRes] = await Promise.allSettled([
          resourceService.getAll(),
          bookingService.getMy(),
          ticketService.getMy(),
        ]);

        const resources = resourcesRes.status === 'fulfilled' ? resourcesRes.value.data : [];
        const bookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.data : [];
        const tickets = ticketsRes.status === 'fulfilled' ? ticketsRes.value.data : [];

        setStats({
          totalResources: resources.length,
          activeResources: resources.filter(r => r.status === 'ACTIVE').length,
          myBookings: bookings.length,
          pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
          myTickets: tickets.length,
          openTickets: tickets.filter(t => t.status === 'OPEN').length,
        });
        setRecentBookings(bookings.slice(0, 5));
        setRecentTickets(tickets.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusBadge = (status) => {
    const map = {
      PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
      CANCELLED: 'badge-cancelled', OPEN: 'badge-open', IN_PROGRESS: 'badge-in-progress',
      RESOLVED: 'badge-resolved', CLOSED: 'badge-closed',
    };
    return <span className={`badge ${map[status] || ''}`}>{status?.replace('_', ' ')}</span>;
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>Here's what's happening on campus today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/bookings" className="btn btn-primary">
            <CalendarIcon style={{ width: 16, height: 16 }} /> New Booking
          </Link>
          <Link to="/tickets" className="btn btn-secondary">
            <WrenchScrewdriverIcon style={{ width: 16, height: 16 }} /> Report Issue
          </Link>
        </div>
      </div>

      <div className="grid grid-4 mb-4">
        <StatCard label="Available Resources" value={stats.activeResources} icon={BuildingOfficeIcon} color="var(--primary)" />
        <StatCard label="My Bookings" value={stats.myBookings} icon={CalendarIcon} color="var(--success)" />
        <StatCard label="Pending Bookings" value={stats.pendingBookings} icon={ClockIcon} color="var(--warning)" />
        <StatCard label="My Open Tickets" value={stats.openTickets} icon={WrenchScrewdriverIcon} color="var(--danger)" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Bookings</h2>
            <Link to="/bookings" className="btn btn-sm btn-secondary">View all</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="empty-state">
              <CalendarIcon />
              <p>No bookings yet</p>
              <Link to="/resources" className="btn btn-sm btn-primary mt-3">Browse Resources</Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.resource?.name}</td>
                      <td>{b.bookingDate}</td>
                      <td>{statusBadge(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Tickets</h2>
            <Link to="/tickets" className="btn btn-sm btn-secondary">View all</Link>
          </div>
          {recentTickets.length === 0 ? (
            <div className="empty-state">
              <WrenchScrewdriverIcon />
              <p>No tickets reported</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map(t => (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td>{t.category?.replace('_', ' ')}</td>
                      <td>{statusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
