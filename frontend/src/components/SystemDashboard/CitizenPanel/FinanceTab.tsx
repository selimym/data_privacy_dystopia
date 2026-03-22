import type { FinanceRecord } from '@/types/citizen'

interface FinanceTabProps {
  finance: FinanceRecord
}

export function FinanceTab({ finance }: FinanceTabProps) {
  return (
    <div data-testid="finance-tab" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Credit Score: <span style={{ color: 'var(--text-primary)' }}>{finance.credit_score}</span>
          {' '} | Employer: <span style={{ color: 'var(--text-primary)' }}>{finance.employer}</span>
          {' '} | Income: <span style={{ color: 'var(--text-primary)' }}>${finance.annual_income.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Accounts
      </div>
      <table className="data-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>Bank</th>
            <th>Type</th>
            <th>Balance</th>
            <th>Opened</th>
          </tr>
        </thead>
        <tbody>
          {finance.accounts.map(a => (
            <tr key={a.id}>
              <td>{a.bank}</td>
              <td style={{ textTransform: 'capitalize' }}>{a.type}</td>
              <td>${a.balance.toLocaleString()}</td>
              <td>{a.opened_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Recent Transactions
      </div>
      <table className="data-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Merchant</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>
          {finance.transactions.map((t, i) => (
            <tr key={i} style={t.is_suspicious ? { color: 'var(--color-amber)' } : undefined}>
              <td>{t.date}</td>
              <td>{t.merchant}</td>
              <td>{t.category}</td>
              <td>${t.amount.toLocaleString()}</td>
              <td>{t.is_suspicious ? '⚠' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {finance.debts.length > 0 && (
        <>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Debts
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Creditor</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {finance.debts.map((d, i) => (
                <tr key={i} style={d.delinquent ? { color: 'var(--color-red)' } : undefined}>
                  <td>{d.type}</td>
                  <td>{d.creditor}</td>
                  <td>${d.amount.toLocaleString()}</td>
                  <td>{d.delinquent ? 'DELINQUENT' : 'Current'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
