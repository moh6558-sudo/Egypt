import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import StatusPill from '../components/StatusPill.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../api.js';
import { money, monthLabel } from '../lib/format.js';

function PlanIcon({ active }) {
  return active ? <Icon name="check" size={14} /> : <Icon name="sparkle" size={14} />;
}

export default function Billing() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState('');

  const load = useCallback(() => {
    api('/api/billing')
      .then((payload) => {
        setData(payload);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const switchPlan = async (planId) => {
    setSwitching(planId);
    try {
      await api('/api/billing/plan', { method: 'POST', body: { plan_id: planId } });
      toast.ok('Plan updated');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSwitching('');
    }
  };

  if (error) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon">
            <Icon name="close" size={19} />
          </div>
          <h4>Could not load billing</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="skeleton" style={{ height: 190 }} />
        <div className="skeleton" style={{ height: 260 }} />
      </div>
    );
  }

  const { usage } = data;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="grid-2" style={{ marginTop: 0 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Current subscription</h3>
              <p>Billed monthly · cancel anytime</p>
            </div>
            <div className="spacer" />
            <StatusPill value={data.subscription_status} />
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted-2)', marginBottom: 4 }}>Plan</div>
                <div style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.03em' }}>
                  {data.plan_name}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="plan-price">
                  {money(data.price)}
                  <span> /mo</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>
                  renews {new Date(data.renews_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="meter">
              <div className="meter-top">
                <span>Minutes used</span>
                <span>
                  {usage.minutes_used} / {usage.included_minutes}
                </span>
              </div>
              <div className="meter-track">
                <div className="meter-fill" style={{ width: `${usage.percent}%` }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, fontSize: 12.5, color: 'var(--muted)' }}>
              <div>
                <div style={{ color: 'var(--muted-2)', fontSize: 11 }}>Calls this month</div>
                <div style={{ fontSize: 15, fontWeight: 640, color: 'var(--text)' }}>{usage.calls}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted-2)', fontSize: 11 }}>Phone numbers</div>
                <div style={{ fontSize: 15, fontWeight: 640, color: 'var(--text)' }}>
                  {usage.phone_numbers}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Monthly statements</h3>
              <p>Derived from your actual call activity</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Calls</th>
                  <th>Minutes</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.statements.map((statement) => (
                  <tr key={statement.period}>
                    <td className="cell-main">{monthLabel(statement.period)}</td>
                    <td className="cell-num">{statement.calls}</td>
                    <td className="cell-num">{statement.minutes}</td>
                    <td className="cell-num">{money(statement.amount)}</td>
                    <td>
                      <span className={`pill ${statement.status === 'Paid' ? 'Completed' : 'trialing'}`}>
                        {statement.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.statements.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">
                        <h4>No statements yet</h4>
                        <p>Your first statement appears after the first month of call activity.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 10 }}>
          Change plan
        </div>
        <div className="plan-grid">
          {data.plans.map((plan) => {
            const current = plan.id === data.plan_id;
            return (
              <div className={`plan-option ${current ? 'current' : ''}`} key={plan.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      display: 'grid',
                      placeItems: 'center',
                      background: current ? 'rgba(124,108,255,0.18)' : '#171d29',
                      color: current ? '#b3a8ff' : 'var(--muted)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <PlanIcon active={current} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 640 }}>{plan.name}</div>
                  {current ? (
                    <span className="pill neutral" style={{ marginLeft: 'auto' }}>
                      Current
                    </span>
                  ) : null}
                </div>

                <div className="plan-price">
                  {money(plan.price)}
                  <span> /mo</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: -6 }}>
                  {plan.included_minutes.toLocaleString('en-US')} minutes · {plan.phone_numbers}{' '}
                  number{plan.phone_numbers === 1 ? '' : 's'}
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Icon name="check" size={13} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`btn ${current ? '' : 'btn-primary'}`}
                  style={{ marginTop: 'auto' }}
                  disabled={current || switching === plan.id}
                  onClick={() => switchPlan(plan.id)}
                >
                  {current ? 'Active plan' : switching === plan.id ? 'Switching…' : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
