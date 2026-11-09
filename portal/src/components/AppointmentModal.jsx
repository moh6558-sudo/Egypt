import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { nextHourInputValue } from '../lib/format.js';

const EMPTY = { customer_name: '', phone: '', service: '', scheduled_at: '' };

export default function AppointmentModal({ open, onClose, onSubmit, busy, error }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, scheduled_at: nextHourInputValue() });
  }, [open]);

  if (!open) return null;

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      service: form.service.trim(),
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      status: 'Scheduled',
    });
  };

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="New appointment">
        <div className="modal-head">
          <h3>New appointment</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          {error ? <div className="form-error" style={{ marginBottom: 14 }}>{error}</div> : null}
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="field">
              <label htmlFor="customer_name">Customer name</label>
              <input
                id="customer_name"
                className="input"
                value={form.customer_name}
                onChange={update('customer_name')}
                placeholder="Alicia Moreno"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                className="input"
                value={form.phone}
                onChange={update('phone')}
                placeholder="+1 (415) 555-0188"
              />
            </div>
            <div className="field">
              <label htmlFor="service">Service requested</label>
              <input
                id="service"
                className="input"
                value={form.service}
                onChange={update('service')}
                placeholder="New patient cleaning"
              />
            </div>
            <div className="field">
              <label htmlFor="scheduled_at">Date &amp; time</label>
              <input
                id="scheduled_at"
                className="input"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={update('scheduled_at')}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Create appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
