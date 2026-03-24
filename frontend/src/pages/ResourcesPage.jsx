import React, { useEffect, useState } from 'react';
import { resourceService } from '../services';
import { useAuth } from '../context/AuthContext';
import ResourceCard from '../components/resources/ResourceCard';
import ResourceModal from '../components/resources/ResourceModal';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

const TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];

export default function ResourcesPage() {
  const { isAdmin } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [filters, setFilters] = useState({ type: '', status: '', location: '', minCapacity: '' });

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.location) params.location = filters.location;
      if (filters.minCapacity) params.minCapacity = filters.minCapacity;
      const res = await resourceService.getAll(params);
      setResources(res.data);
    } catch (err) {
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await resourceService.delete(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete resource');
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingResource) {
        const res = await resourceService.update(editingResource.id, data);
        setResources(prev => prev.map(r => r.id === editingResource.id ? res.data : r));
      } else {
        const res = await resourceService.create(data);
        setResources(prev => [...prev, res.data]);
      }
      setShowModal(false);
      setEditingResource(null);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Facilities & Resources</h1>
          <p>Browse and book campus facilities and equipment</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditingResource(null); setShowModal(true); }}>
            <PlusIcon style={{ width: 16, height: 16 }} /> Add Resource
          </button>
        )}
      </div>

      <form className="filter-bar" onSubmit={handleFilter}>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-control" placeholder="e.g. Block A" value={filters.location} onChange={e => setFilters(p => ({ ...p, location: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Min Capacity</label>
          <input className="form-control" type="number" placeholder="e.g. 30" value={filters.minCapacity} onChange={e => setFilters(p => ({ ...p, minCapacity: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary">
            <FunnelIcon style={{ width: 16, height: 16 }} /> Filter
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => { setFilters({ type: '', status: '', location: '', minCapacity: '' }); setTimeout(fetchResources, 0); }}>
            Clear
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : resources.length === 0 ? (
        <div className="empty-state card">
          <p>No resources found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {resources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ResourceModal
          resource={editingResource}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingResource(null); }}
        />
      )}
    </div>
  );
}
