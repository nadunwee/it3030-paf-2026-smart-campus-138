import React, { useEffect, useState } from 'react';
import { resourceService } from '../../services';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function BookingModal({ preselectedResourceId, onSave, onClose }) {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    resourceId: preselectedResourceId || '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    resourceService.getAll({ status: 'ACTIVE' }).then(res => setResources(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.resourceId) { setError('Please select a resource'); return; }
    if (form.startTime >= form.endTime) { setError('Start time must be before end time'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        resourceId: parseInt(form.resourceId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees) : null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>New Booking Request</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Resource *</label>
              <select name="resourceId" className="form-select" value={form.resourceId} onChange={handleChange} required>
                <option value="">Select a resource...</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} – {r.location}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input name="bookingDate" type="date" className="form-control" min={today} value={form.bookingDate} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input name="startTime" type="time" className="form-control" value={form.startTime} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input name="endTime" type="time" className="form-control" value={form.endTime} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose *</label>
              <input name="purpose" className="form-control" placeholder="e.g. Team meeting, Lecture, Lab session" value={form.purpose} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Attendees</label>
              <input name="expectedAttendees" type="number" className="form-control" min={1} value={form.expectedAttendees} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
