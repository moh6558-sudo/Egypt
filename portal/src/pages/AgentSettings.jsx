import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const FALLBACK_HOURS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((day) => ({ day, open: '09:00', close: '17:00', closed: day === 'Sunday' }));

const PLACEHOLDERS = ['{business_name}', '{agent_name}', '{time_of_day}'];

function toForm(company) {
  return {
    name: company.name || '',
    industry: company.industry || '',
    phone_number: company.phone_number || '',
    greeting_script: company.greeting_script || '',
    calendar_link: company.calendar_link || '',
    business_hours: company.business_hours?.length ? company.business_hours : FALLBACK_HOURS,
    faqs: company.faqs || [],
  };
}

export default function AgentSettings() {
  const { company, setCompany } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => (company ? toForm(company) : null));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) setForm(toForm(company));
    // Re-sync only when a different workspace loads, not on every save echo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  if (!form) return null;

  const set = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const setHour = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      business_hours: prev.business_hours.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      ),
    }));
    setDirty(true);
  };

  const setFaq = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    }));
    setDirty(true);
  };

  const addFaq = () => {
    setForm((prev) => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
    setDirty(true);
  };

  const removeFaq = (index) => {
    setForm((prev) => ({ ...prev, faqs: prev.faqs.filter((_, rowIndex) => rowIndex !== index) }));
    setDirty(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await api('/api/company', {
        method: 'PUT',
        body: {
          name: form.name,
          industry: form.industry,
          phone_number: form.phone_number,
          greeting_script: form.greeting_script,
          calendar_link: form.calendar_link,
          business_hours: form.business_hours,
          faqs: form.faqs.filter((faq) => faq.question.trim() || faq.answer.trim()),
        },
      });
      setCompany(updated);
      setForm(toForm(updated));
      setDirty(false);
      toast.ok('Agent settings saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} style={{ display: 'grid', gap: 16, maxWidth: 980 }}>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Business profile</h3>
            <p>How your agent introduces and identifies the company</p>
          </div>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Business name</label>
              <input id="name" className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="field">
              <label htmlFor="industry">Industry</label>
              <input
                id="industry"
                className="input"
                value={form.industry}
                onChange={set('industry')}
                placeholder="Dental care"
              />
            </div>
            <div className="field">
              <label htmlFor="phone">
                Receptionist phone number <span className="hint">the number callers dial</span>
              </label>
              <input
                id="phone"
                className="input"
                value={form.phone_number}
                onChange={set('phone_number')}
                placeholder="+1 (415) 555-0142"
              />
            </div>
            <div className="field">
              <label htmlFor="calendar">
                Calendar link <span className="hint">used for booking hand-off</span>
              </label>
              <input
                id="calendar"
                className="input"
                value={form.calendar_link}
                onChange={set('calendar_link')}
                placeholder="https://cal.com/your-practice"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Greeting script</h3>
            <p>The first words your agent says on every call</p>
          </div>
          <div className="spacer" />
          <span className="pill neutral">{form.greeting_script.length} chars</span>
        </div>
        <div className="card-body">
          <div className="field">
            <label htmlFor="greeting">Opening script</label>
            <textarea
              id="greeting"
              className="textarea"
              rows={5}
              value={form.greeting_script}
              onChange={set('greeting_script')}
              placeholder="Thanks for calling {business_name}, this is {agent_name}. How can I help you today?"
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {PLACEHOLDERS.map((token) => (
                <span
                  key={token}
                  className="pill neutral"
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, cursor: 'default' }}
                >
                  {token}
                </span>
              ))}
              <span style={{ fontSize: 11.5, color: 'var(--muted-2)', alignSelf: 'center' }}>
                replaced automatically at call time
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Business hours</h3>
            <p>Calls outside these hours follow your after-hours script</p>
          </div>
        </div>
        <div className="card-body">
          <div className="hours-grid">
            {form.business_hours.map((row, index) => (
              <div className={`hours-row ${row.closed ? 'closed' : ''}`} key={row.day}>
                <span className="day">{row.day}</span>
                <input
                  className="input"
                  type="time"
                  value={row.open}
                  disabled={row.closed}
                  aria-label={`${row.day} open time`}
                  onChange={(event) => setHour(index, 'open', event.target.value)}
                />
                <input
                  className="input"
                  type="time"
                  value={row.close}
                  disabled={row.closed}
                  aria-label={`${row.day} close time`}
                  onChange={(event) => setHour(index, 'close', event.target.value)}
                />
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={row.closed}
                    onChange={(event) => setHour(index, 'closed', event.target.checked)}
                  />
                  Closed
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>FAQs</h3>
            <p>Answers your agent can give without transferring the call</p>
          </div>
          <div className="spacer" />
          <button type="button" className="btn btn-sm" onClick={addFaq}>
            <Icon name="plus" size={14} />
            Add FAQ
          </button>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          {form.faqs.length === 0 ? (
            <div className="empty" style={{ padding: '24px 8px' }}>
              <h4>No FAQs yet</h4>
              <p>Add the questions callers ask most so your agent can answer them instantly.</p>
            </div>
          ) : null}
          {form.faqs.map((faq, index) => (
            <div className="faq-item" key={index}>
              <div className="field">
                <label>Question</label>
                <input
                  className="input"
                  value={faq.question}
                  onChange={(event) => setFaq(index, 'question', event.target.value)}
                  placeholder="Do you accept my insurance?"
                />
              </div>
              <div className="field">
                <label>Answer</label>
                <textarea
                  className="textarea"
                  value={faq.answer}
                  onChange={(event) => setFaq(index, 'answer', event.target.value)}
                  placeholder="We are in network with…"
                />
              </div>
              <button
                type="button"
                className="icon-btn"
                style={{ marginTop: 22 }}
                onClick={() => removeFaq(index)}
                aria-label="Remove FAQ"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {dirty ? (
          <span className="form-note">Unsaved changes</span>
        ) : (
          <span className="form-note">All changes saved</span>
        )}
      </div>
    </form>
  );
}
