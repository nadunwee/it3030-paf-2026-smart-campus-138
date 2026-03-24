import React, { useEffect, useState } from 'react';
import { userService } from '../services';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userService.getAll()
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await userService.updateRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? res.data : u));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Users</h1>
          <p>View and manage user roles</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--primary)', color: 'var(--white)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role?.toLowerCase()}`}>{u.role}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{u.createdAt?.split('T')[0]}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: 'auto', fontSize: '0.8rem' }}
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
