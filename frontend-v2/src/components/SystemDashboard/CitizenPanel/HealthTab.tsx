import type { HealthRecord } from '@/types/citizen'

interface HealthTabProps {
  health: HealthRecord
}

export function HealthTab({ health }: HealthTabProps) {
  return (
    <div data-testid="health-tab" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      {health.conditions.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Conditions
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{health.conditions.join(', ')}</div>
        </div>
      )}

      {health.sensitive_conditions.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--color-amber)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Sensitive Conditions
          </div>
          <div style={{ color: 'var(--color-amber)' }}>{health.sensitive_conditions.join(', ')}</div>
        </div>
      )}

      {health.medications.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Medications
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{health.medications.join(', ')}</div>
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Recent Visits
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Reason</th>
            <th>Specialty</th>
            <th>Facility</th>
          </tr>
        </thead>
        <tbody>
          {health.visits.map((v, i) => (
            <tr key={i}>
              <td>{v.date}</td>
              <td>{v.reason}</td>
              <td>{v.specialty}</td>
              <td>{v.facility}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
