import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];

export default function ResourceModal({ resource, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', type: 'LECTURE_HALL', capacity: '', location: '',
    availabilityWindows: '', status: 'ACTIVE', description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resource) {
      setForm({
        name: resource.name || '',
        type: resource.type || 'LECTURE_HALL',
        capacity: resource.capacity || '',
        location: resource.location || '',
        availabilityWindows: resource.availabilityWindows || '',
        status: resource.status || 'ACTIVE',
        description: resource.description || '',
      });
    }
  }, [resource]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{resource ? 'Edit Resource' : 'Add Resource'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                  {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input name="location" className="form-control" value={form.location} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input name="capacity" className="form-control" type="number" value={form.capacity} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Availability Windows</label>
              <input name="availabilityWindows" className="form-control" placeholder="e.g. Mon-Fri 08:00-18:00" value={form.availabilityWindows} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
