import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services';
import { BellIcon } from '@heroicons/react/24/outline';

const TYPE_ICONS = {
  BOOKING_APPROVED: '✅',
  BOOKING_REJECTED: '❌',
  BOOKING_CANCELLED: '🚫',
  TICKET_STATUS_CHANGED: '🔧',
  TICKET_ASSIGNED: '👤',
  TICKET_COMMENT_ADDED: '💬',
  TICKET_RESOLVED: '✅',
};

export default function NotificationPanel({ onCountChange, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.read).length;
      onCountChange(unread);
    } catch (err) {
      // Backend may not have data yet
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      const unread = notifications.filter(n => !n.read && n.id !== id).length;
      onCountChange(unread);
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onCountChange(0);
    } catch (err) {}
  };

  return (
    <div className="notification-panel">
      <div style={{
        padding: '0.875rem 1rem',
        borderBottom: '1px solid var(--gray-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-sm btn-secondary" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '2rem' }}><div className="spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <BellIcon style={{ width: 32, height: 32, margin: '0 auto 0.5rem', color: 'var(--gray-300)' }} />
          <p style={{ fontSize: '0.875rem' }}>No notifications yet</p>
        </div>
      ) : (
        notifications.map(n => (
          <div
            key={n.id}
            className={`notification-item ${!n.read ? 'unread' : ''}`}
            onClick={() => !n.read && markRead(n.id)}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{TYPE_ICONS[n.type] || '🔔'}</span>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-700)' }}>{n.message}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                  {n.createdAt?.split('T')[0]}
                </p>
              </div>
              {!n.read && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--primary)', flexShrink: 0, marginTop: '0.25rem',
                }} />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
