import React, { useEffect, useState } from 'react';
import { ticketService, userService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { XMarkIcon, PaperAirplaneIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const ALL_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function TicketDetail({ ticket: initialTicket, isAdmin, isTechnician, onClose }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(initialTicket);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [statusForm, setStatusForm] = useState({ status: '', assignedToId: '', resolutionNotes: '', rejectionReason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
    if (isAdmin || isTechnician) {
      userService.getAll().then(res => {
        setTechnicians(res.data.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN'));
      }).catch(() => {});
    }
  }, []);

  const loadComments = async () => {
    try {
      const res = await ticketService.getComments(ticket.id);
      setComments(res.data);
    } catch (err) {}
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {};
      if (statusForm.status) payload.status = statusForm.status;
      if (statusForm.assignedToId) payload.assignedToId = parseInt(statusForm.assignedToId);
      if (statusForm.resolutionNotes) payload.resolutionNotes = statusForm.resolutionNotes;
      if (statusForm.rejectionReason) payload.rejectionReason = statusForm.rejectionReason;
      const res = await ticketService.updateStatus(ticket.id, payload);
      setTicket(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await ticketService.addComment(ticket.id, { content: newComment });
      setNewComment('');
      loadComments();
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingComment) return;
    try {
      await ticketService.updateComment(ticket.id, commentId, { content: editingComment.content });
      setEditingComment(null);
      loadComments();
    } catch (err) {
      alert('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await ticketService.deleteComment(ticket.id, commentId);
      loadComments();
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  const statusBadgeClass = {
    OPEN: 'badge-open', IN_PROGRESS: 'badge-in-progress', RESOLVED: 'badge-resolved',
    CLOSED: 'badge-closed', REJECTED: 'badge-rejected',
  }[ticket.status] || '';

  const priorityBadgeClass = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical' }[ticket.priority] || '';

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <h2>Ticket #{ticket.id} – {ticket.category?.replace('_', ' ')}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Ticket info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Status</div>
              <span className={`badge ${statusBadgeClass}`}>{ticket.status?.replace('_', ' ')}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Priority</div>
              <span className={`badge ${priorityBadgeClass}`}>{ticket.priority}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Reporter</div>
              <span style={{ fontSize: '0.875rem' }}>{ticket.reporter?.name}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Location</div>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{ticket.location}</p>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Description</div>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--gray-700)' }}>{ticket.description}</p>
          </div>
          {ticket.assignedTo && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Assigned To</div>
              <p style={{ fontSize: '0.875rem' }}>{ticket.assignedTo.name}</p>
            </div>
          )}
          {ticket.resolutionNotes && (
            <div style={{ background: 'var(--gray-50)', padding: '0.875rem', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--success)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Resolution Notes</div>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{ticket.resolutionNotes}</p>
            </div>
          )}

          {/* Status update (admin/technician) */}
          {(isAdmin || isTechnician) && ticket.status !== 'CLOSED' && (
            <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Update Ticket</h4>
              <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="">No change</option>
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  {isAdmin && (
                    <div className="form-group">
                      <label className="form-label">Assign Technician</label>
                      <select className="form-select" value={statusForm.assignedToId} onChange={e => setStatusForm(p => ({ ...p, assignedToId: e.target.value }))}>
                        <option value="">No change</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {statusForm.status === 'RESOLVED' && (
                  <div className="form-group">
                    <label className="form-label">Resolution Notes</label>
                    <textarea className="form-control" rows={2} value={statusForm.resolutionNotes} onChange={e => setStatusForm(p => ({ ...p, resolutionNotes: e.target.value }))} />
                  </div>
                )}
                {statusForm.status === 'REJECTED' && (
                  <div className="form-group">
                    <label className="form-label">Rejection Reason</label>
                    <input className="form-control" value={statusForm.rejectionReason} onChange={e => setStatusForm(p => ({ ...p, rejectionReason: e.target.value }))} />
                  </div>
                )}
                <div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Update Ticket'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Comments */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Comments ({comments.length})
            </h4>
            {comments.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No comments yet.</p>
            ) : comments.map(c => (
              <div key={c.id} className="comment">
                {editingComment?.id === c.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      className="form-control"
                      value={editingComment.content}
                      onChange={e => setEditingComment(p => ({ ...p, content: e.target.value }))}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(c.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingComment(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="comment-author">{c.author?.name}</span>
                      <span className="comment-time">{c.createdAt?.split('T')[0]}</span>
                    </div>
                    <p className="comment-content">{c.content}</p>
                    {(c.author?.id === user?.id || isAdmin) && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                        {c.author?.id === user?.id && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingComment(c)}>
                            <PencilIcon style={{ width: 12, height: 12 }} /> Edit
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteComment(c.id)}>
                          <TrashIcon style={{ width: 12, height: 12 }} /> Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input
                className="form-control"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <PaperAirplaneIcon style={{ width: 14, height: 14 }} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
