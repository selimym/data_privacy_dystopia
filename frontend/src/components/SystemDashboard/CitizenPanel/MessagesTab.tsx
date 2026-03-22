import type { MessageRecord } from '@/types/citizen'

interface MessagesTabProps {
  messages: MessageRecord[]
}

export function MessagesTab({ messages }: MessagesTabProps) {
  return (
    <div data-testid="messages-tab" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Messages ({messages.length})
      </div>
      {messages.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No messages on record.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Contact</th>
              <th>Platform</th>
              <th>Preview</th>
              <th>Encrypted</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(m => (
              <tr
                key={m.id}
                style={m.is_concerning ? { color: 'var(--color-amber)' } : undefined}
              >
                <td>{m.date}</td>
                <td>{m.contact}</td>
                <td>{m.platform}</td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.excerpt.slice(0, 60)}{m.excerpt.length > 60 ? '…' : ''}
                </td>
                <td>{m.is_encrypted ? '🔒 YES' : 'No'}</td>
                <td style={{ textTransform: 'capitalize' }}>{m.category.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
