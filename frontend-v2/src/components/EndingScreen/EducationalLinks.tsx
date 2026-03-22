interface Resource {
  title: string
  url: string
}

const RESOURCES: Resource[] = [
  { title: 'EFF — Surveillance Self-Defense', url: 'https://ssd.eff.org' },
  { title: 'Privacy International', url: 'https://privacyinternational.org' },
  { title: 'ACLU — Surveillance & Privacy', url: 'https://www.aclu.org/issues/privacy-technology/surveillance-technologies' },
  { title: 'Access Now', url: 'https://www.accessnow.org' },
  { title: 'Human Rights Watch — Technology', url: 'https://www.hrw.org/topic/technology-and-rights' },
]

export default function EducationalLinks() {
  return (
    <div
      data-testid="educational-links"
      style={{ marginBottom: '32px' }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.25em',
          color: '#6b7280',
          textTransform: 'uppercase',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        Learn More / Take Action
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {RESOURCES.map(resource => (
          <li key={resource.url} style={{ marginBottom: '8px' }}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#60a5fa',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(96,165,250,0.05)',
                border: '1px solid rgba(96,165,250,0.15)',
                borderRadius: '4px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(96,165,250,0.12)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(96,165,250,0.05)'
              }}
            >
              <span style={{ color: '#3b82f6', fontSize: '10px' }}>→</span>
              {resource.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
