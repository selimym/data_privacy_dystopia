import type { SocialMediaRecord } from '@/types/citizen'

interface SocialTabProps {
  social: SocialMediaRecord
}

export function SocialTab({ social }: SocialTabProps) {
  const flaggedConnections = social.connections.filter(c => c.is_flagged)

  return (
    <div data-testid="social-tab" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Platforms
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>{social.platforms.join(', ')}</div>
      </div>

      <div style={{ marginBottom: 10, display: 'flex', gap: 16 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
          Connections: <span style={{ color: 'var(--text-primary)' }}>{social.connections.length}</span>
        </span>
        {flaggedConnections.length > 0 && (
          <span style={{ color: 'var(--color-red)', fontSize: 10 }}>
            Flagged: {flaggedConnections.length}
          </span>
        )}
      </div>

      {social.flagged_group_memberships.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--color-red)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Flagged Groups
          </div>
          <div style={{ color: 'var(--color-red)' }}>{social.flagged_group_memberships.join(', ')}</div>
        </div>
      )}

      {social.political_inferences.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--color-amber)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Political Inferences
          </div>
          <div style={{ color: 'var(--color-amber)' }}>{social.political_inferences.join(', ')}</div>
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Posts
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Platform</th>
            <th>Content</th>
            <th>Sentiment</th>
          </tr>
        </thead>
        <tbody>
          {social.posts.map((p, i) => (
            <tr key={i} style={p.is_concerning ? { color: 'var(--color-amber)' } : undefined}>
              <td>{p.date}</td>
              <td>{p.platform}</td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.content.slice(0, 80)}{p.content.length > 80 ? '…' : ''}
              </td>
              <td>{p.is_concerning ? '⚠ CONCERNING' : 'Normal'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
