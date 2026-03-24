import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bookingService, resourceService } from '../services';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/bookings/BookingModal';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';

const STATUS_CLASSES = {
  PENDING: 'badge-pending', APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled',
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [preselectedResourceId, setPreselectedResourceId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const rid = searchParams.get('resourceId');
    if (rid) {
      setPreselectedResourceId(parseInt(rid));
      setShowModal(true);
    }
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingService.getMy();
      setBookings(res.data);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingService.cancel(id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleCreate = async (data) => {
    const res = await bookingService.create(data);
    setBookings(prev => [res.data, ...prev]);
    setShowModal(false);
    setPreselectedResourceId(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Bookings</h1>
          <p>Manage your resource booking requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setPreselectedResourceId(null); setShowModal(true); }}>
          <PlusIcon style={{ width: 16, height: 16 }} /> New Booking
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : bookings.length === 0 ? (
        <div className="empty-state card">
          <CalendarIcon />
          <p>No bookings yet</p>
          <Link to="/resources" className="btn btn-primary btn-sm mt-3">Browse Resources</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td><strong>{b.resource?.name}</strong></td>
                    <td>{b.bookingDate}</td>
                    <td>{b.startTime} – {b.endTime}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.purpose}</td>
                    <td>
                      <span className={`badge ${STATUS_CLASSES[b.status] || ''}`}>
                        {b.status}
                      </span>
                      {b.reviewReason && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                          Reason: {b.reviewReason}
                        </div>
                      )}
                    </td>
                    <td>
                      {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <BookingModal
          preselectedResourceId={preselectedResourceId}
          onSave={handleCreate}
          onClose={() => { setShowModal(false); setPreselectedResourceId(null); }}
        />
      )}
    </div>
  );
}
