import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../notifications/NotificationPanel';

export default function Header({ title }) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="header">
      <span className="header-title">{title}</span>
      <div className="header-actions">
        <div style={{ position: 'relative' }} ref={panelRef}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.5rem', position: 'relative' }}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <BellIcon style={{ width: 20, height: 20 }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4, right: -4,
                background: 'var(--danger)',
                color: 'var(--white)',
                borderRadius: '50%',
                width: 18, height: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel
              onCountChange={setUnreadCount}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--primary)', color: 'var(--white)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem',
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
