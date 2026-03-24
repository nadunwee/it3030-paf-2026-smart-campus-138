import React, { useEffect, useState } from 'react';
import { bookingService } from '../services';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const STATUS_CLASSES = {
  PENDING: 'badge-pending', APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', resourceId: '' });
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.resourceId) params.resourceId = filters.resourceId;
      const res = await bookingService.getAll(params);
      setBookings(res.data);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleApprove = async (id) => {
    const reason = prompt('Approval note (optional):') || '';
    try {
      await bookingService.approve(id, { reason });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await bookingService.reject(id, { reason });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Bookings</h1>
          <p>Review and manage all booking requests</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">All</option>
            {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={fetchBookings}>Filter</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No bookings found</td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.user?.name}</td>
                    <td>{b.resource?.name}</td>
                    <td>{b.bookingDate}</td>
                    <td>{b.startTime} – {b.endTime}</td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.purpose}</td>
                    <td>
                      <span className={`badge ${STATUS_CLASSES[b.status] || ''}`}>{b.status}</span>
                    </td>
                    <td>
                      {b.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(b.id)}>
                            <CheckIcon style={{ width: 14, height: 14 }} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(b.id)}>
                            <XMarkIcon style={{ width: 14, height: 14 }} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
