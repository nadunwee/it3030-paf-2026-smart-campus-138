import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinIcon, UsersIcon, ClockIcon, PencilIcon, TrashIcon, CalendarIcon,
} from '@heroicons/react/24/outline';

const typeColors = {
  LECTURE_HALL: '#2563eb',
  LAB: '#7c3aed',
  MEETING_ROOM: '#16a34a',
  EQUIPMENT: '#d97706',
};

const typeEmojis = {
  LECTURE_HALL: '🏛️',
  LAB: '🔬',
  MEETING_ROOM: '🤝',
  EQUIPMENT: '📷',
};

export default function ResourceCard({ resource, isAdmin, onEdit, onDelete }) {
  const color = typeColors[resource.type] || '#2563eb';
  const emoji = typeEmojis[resource.type] || '📦';
  const statusClass = {
    ACTIVE: 'badge-active',
    OUT_OF_SERVICE: 'badge-out-of-service',
    UNDER_MAINTENANCE: 'badge-under-maintenance',
  }[resource.status] || '';

  return (
    <div className="resource-card">
      <div className="resource-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="resource-type-icon" style={{ background: `${color}20` }}>
            <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{resource.name}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              {resource.type?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <span className={`badge ${statusClass}`}>
          {resource.status?.replace('_', ' ')}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
          <MapPinIcon style={{ width: 14, height: 14 }} />
          {resource.location}
        </div>
        {resource.capacity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
            <UsersIcon style={{ width: 14, height: 14 }} />
            Capacity: {resource.capacity}
          </div>
        )}
        {resource.availabilityWindows && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
            <ClockIcon style={{ width: 14, height: 14 }} />
            {resource.availabilityWindows}
          </div>
        )}
        {resource.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
            {resource.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        {resource.status === 'ACTIVE' && (
          <Link
            to={`/bookings/new?resourceId=${resource.id}`}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <CalendarIcon style={{ width: 14, height: 14 }} />
            Book
          </Link>
        )}
        {isAdmin && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(resource)}>
              <PencilIcon style={{ width: 14, height: 14 }} />
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(resource.id)}>
              <TrashIcon style={{ width: 14, height: 14 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
