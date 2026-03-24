import React, { useState } from 'react';
import { XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'IT_EQUIPMENT', 'HVAC', 'STRUCTURAL', 'CLEANING', 'SECURITY', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function TicketModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    location: '', category: 'IT_EQUIPMENT', description: '',
    priority: 'MEDIUM', contactDetails: '', resourceId: '',
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 3) { setError('Maximum 3 files allowed'); return; }
    setFiles(selected);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      const ticketData = {
        location: form.location,
        category: form.category,
        description: form.description,
        priority: form.priority,
        contactDetails: form.contactDetails || null,
      };
      formData.append('ticket', new Blob([JSON.stringify(ticketData)], { type: 'application/json' }));
      files.forEach(f => formData.append('files', f));
      await onSave(formData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Report an Incident</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Location / Room *</label>
              <input name="location" className="form-control" placeholder="e.g. Block A, Room 101" value={form.location} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea name="description" className="form-control" rows={4} placeholder="Describe the issue in detail..." value={form.description} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Details</label>
              <input name="contactDetails" className="form-control" placeholder="Phone or email for follow-up" value={form.contactDetails} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">
                <PaperClipIcon style={{ width: 14, height: 14, display: 'inline' }} /> Attachments (max 3 images)
              </label>
              <input type="file" accept="image/*" multiple className="form-control" onChange={handleFiles} />
              {files.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {files.map(f => f.name).join(', ')}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
