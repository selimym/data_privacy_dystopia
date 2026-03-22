import type { JudicialRecord } from '@/types/citizen'

interface JudicialTabProps {
  judicial: JudicialRecord
}

export function JudicialTab({ judicial }: JudicialTabProps) {
  return (
    <div data-testid="judicial-tab" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 10 }}>
        {judicial.has_felony && (
          <span style={{ color: 'var(--color-red)', letterSpacing: '0.06em' }}>● FELONY</span>
        )}
        {judicial.has_violent_offense && (
          <span style={{ color: 'var(--color-red)', letterSpacing: '0.06em' }}>● VIOLENT OFFENSE</span>
        )}
        {judicial.has_drug_offense && (
          <span style={{ color: 'var(--color-amber)', letterSpacing: '0.06em' }}>● DRUG OFFENSE</span>
        )}
        {!judicial.has_felony && !judicial.has_violent_offense && !judicial.has_drug_offense && (
          <span style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>No significant flags</span>
        )}
      </div>

      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Cases
      </div>
      {judicial.cases.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>No judicial records.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Type</th>
              <th>Charge</th>
              <th>Date</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {judicial.cases.map(c => (
              <tr key={c.id}>
                <td>{c.id.slice(0, 8)}</td>
                <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                <td>{c.charge}</td>
                <td>{c.date}</td>
                <td>{c.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
