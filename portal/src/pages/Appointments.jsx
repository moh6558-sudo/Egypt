import { useCallback, useEffect, useState } from 'react';
import AppointmentModal from '../components/AppointmentModal.jsx';
import Icon from '../components/Icon.jsx';
import StatusPill from '../components/StatusPill.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { formatDate, formatDayLabel, formatTime } from '../lib/format.js';

const SCOPES = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
];

const STATUSES = ['Scheduled', 'Completed', 'Cancelled'];

export default function Appointments() {
  const toast = useToast();
  const [scope, setScope] = useState('upcoming');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(
    (currentScope = scope) => {
      setRows(null);
      api(`/api/appointments?scope=${currentScope}`)
        .then((data) => {
          setRows(data);
          setError('');
        })
        .catch((err) => setError(err.message));
    },
    [scope]
  );

  useEffect(() => {
    load(scope);
  }, [scope, load]);

  const create = async (payload) => {
    setSaving(true);
    setModalError('');
    try {
      await api('/api/appointments', { method: 'POST', body: payload });
      setModalOpen(false);
      toast.ok('Appointment created');
      load(scope);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (row, status) => {
    try {
      const updated = await api(`/api/appointments/${row.id}`, { method: 'PATCH', body: { status } });
      setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.ok(`Marked as ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the appointment for ${row.customer_name}?`)) return;
    try {
      await api(`/api/appointments/${row.id}`, { method: 'DELETE' });
      setRows((current) => current.filter((item) => item.id !== row.id));
      toast.ok('Appointment deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={16} />
          New appointment
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="seg" role="tablist" aria-label="Appointment scope">
            {SCOPES.map((option) => (
              <button
                key={option.id}
                role="tab"
                aria-selected={scope === option.id}
                className={scope === option.id ? 'on' : ''}
                onClick={() => setScope(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-2)' }}>
            {rows ? `${rows.length} appointment${rows.length === 1 ? '' : 's'}` : 'Loading…'}
          </div>
        </div>

        {error ? (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="close" size={19} />
            </div>
            <h4>Could not load appointments</h4>
            <p>{error}</p>
          </div>
        ) : null}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && !error ? (
                <tr>
                  <td colSpan={5}>
                    <div className="skeleton" style={{ height: 42, margin: '10px 0' }} />
                    <div className="skeleton" style={{ height: 42, margin: '10px 0' }} />
                  </td>
                </tr>
              ) : null}

              {rows?.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="cell-main">{formatDayLabel(row.scheduled_at)}</div>
                    <div className="cell-sub">
                      {formatDate(row.scheduled_at)} · {formatTime(row.scheduled_at)}
                    </div>
                  </td>
                  <td>
                    <div className="cell-main">{row.customer_name}</div>
                    <div className="cell-sub">{row.phone || 'No phone'}</div>
                  </td>
                  <td className="cell-muted">{row.service || '—'}</td>
                  <td>
                    <StatusPill value={row.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <select
                        className="select select-sm"
                        value={row.status}
                        aria-label={`Status for ${row.customer_name}`}
                        onChange={(event) => changeStatus(row, event.target.value)}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        className="icon-btn"
                        onClick={() => remove(row)}
                        aria-label={`Delete appointment for ${row.customer_name}`}
                        title="Delete"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows && rows.length === 0 && !error ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="empty-icon">
                        <Icon name="calendar" size={19} />
                      </div>
                      <h4>No appointments in this view</h4>
                      <p>Your AI receptionist adds a row here every time it books a caller.</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <AppointmentModal
        open={modalOpen}
        busy={saving}
        error={modalError}
        onClose={() => {
          setModalOpen(false);
          setModalError('');
        }}
        onSubmit={create}
      />
    </>
  );
}
