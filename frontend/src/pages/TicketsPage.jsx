import React, { useEffect, useState } from 'react';
import { ticketService } from '../services';
import { useAuth } from '../context/AuthContext';
import TicketModal from '../components/tickets/TicketModal';
import TicketDetail from '../components/tickets/TicketDetail';
import { PlusIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const STATUS_CLASSES = {
  OPEN: 'badge-open', IN_PROGRESS: 'badge-in-progress',
  RESOLVED: 'badge-resolved', CLOSED: 'badge-closed', REJECTED: 'badge-rejected',
};

const PRIORITY_CLASSES = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical',
};

export default function TicketsPage({ adminView }) {
  const { user, isAdmin, isTechnician } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [error, setError] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let res;
      if (adminView && (isAdmin || isTechnician)) {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        if (filters.category) params.category = filters.category;
        res = await ticketService.getAll(params);
      } else {
        res = await ticketService.getMy();
      }
      setTickets(res.data);
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [adminView]);

  const handleCreate = async (formData) => {
    const res = await ticketService.create(formData);
    setTickets(prev => [res.data, ...prev]);
    setShowCreateModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{adminView ? 'All Incident Tickets' : 'My Incident Tickets'}</h1>
          <p>{adminView ? 'Manage and assign all reported incidents' : 'Track your reported incidents'}</p>
        </div>
        {!adminView && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <PlusIcon style={{ width: 16, height: 16 }} /> Report Issue
          </button>
        )}
      </div>

      {adminView && (
        <div className="filter-bar">
          {[
            { label: 'Status', key: 'status', options: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'] },
            { label: 'Priority', key: 'priority', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            { label: 'Category', key: 'category', options: ['ELECTRICAL', 'PLUMBING', 'IT_EQUIPMENT', 'HVAC', 'STRUCTURAL', 'CLEANING', 'SECURITY', 'OTHER'] },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <select className="form-select" value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}>
                <option value="">All</option>
                {f.options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={fetchTickets}>Filter</button>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state card">
          <WrenchScrewdriverIcon />
          <p>No tickets found</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  {adminView && <th>Reporter</th>}
                  <th>Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    {adminView && <td>{t.reporter?.name}</td>}
                    <td>{t.category?.replace('_', ' ')}</td>
                    <td>{t.location}</td>
                    <td><span className={`badge ${PRIORITY_CLASSES[t.priority] || ''}`}>{t.priority}</span></td>
                    <td><span className={`badge ${STATUS_CLASSES[t.status] || ''}`}>{t.status?.replace('_', ' ')}</span></td>
                    <td>{t.assignedTo?.name || <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}</td>
                    <td style={{ fontSize: '0.8rem' }}>{t.createdAt?.split('T')[0]}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTicket(t)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <TicketModal onSave={handleCreate} onClose={() => setShowCreateModal(false)} />
      )}

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          isAdmin={isAdmin}
          isTechnician={isTechnician}
          onClose={() => { setSelectedTicket(null); fetchTickets(); }}
        />
      )}
    </div>
  );
}
