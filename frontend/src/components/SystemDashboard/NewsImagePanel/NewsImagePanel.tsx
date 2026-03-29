import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import type { NewsStance } from '@/types/game'

function hashCode(str: string): number {
  let h = 0
  for (const c of str) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

function ArticlePhoto({ articleId, stance }: { articleId: string; stance: NewsStance }) {
  const h = hashCode(articleId)
  const bgL = 8 + (h % 8)
  const skyL1 = bgL + 4
  const skyL2 = bgL + 10

  // 7 buildings with deterministic sizes
  const N = 7
  const bw = 100 / N
  const buildings = Array.from({ length: N }, (_, i) => {
    const seed = (h >> (i * 4)) & 0xff
    const seed2 = (h >> (i * 3 + 2)) & 0x1f
    return {
      x: i * bw + bw * 0.1,
      w: bw * 0.8,
      bh: 16 + (seed % 34),
      l: bgL + 12 + (seed2 % 18),
    }
  })

  // Lit windows
  const windows = buildings.flatMap((b, bi) =>
    Array.from({ length: Math.floor(b.bh / 9) + 1 }, (_, wi) => ({
      x: b.x + 2.5,
      y: 56 - b.bh + 5 + wi * 8,
      lit: ((h >> (bi * 3 + wi + 1)) & 1) === 1,
    })).filter(w => w.y < 51 && w.y > 56 - b.bh + 2)
  )

  // Unique SVG ID prefix to avoid gradient collisions across multiple instances
  const uid = `p${h.toString(36).slice(0, 6)}`

  const stanceColor =
    stance === 'critical' ? '#dc2626' :
    stance === 'state_friendly' ? '#059669' :
    null

  return (
    <svg
      viewBox="0 0 100 56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(0,0%,${skyL1}%)`} />
          <stop offset="100%" stopColor={`hsl(0,0%,${skyL2}%)`} />
        </linearGradient>
        <radialGradient id={`${uid}-vig`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="100" height="56" fill={`url(#${uid}-sky)`} />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={56 - b.bh}
          width={b.w}
          height={b.bh}
          fill={`hsl(0,0%,${b.l}%)`}
        />
      ))}

      {/* Windows */}
      {windows.map((w, i) => (
        <rect
          key={`w${i}`}
          x={w.x}
          y={w.y}
          width={2}
          height={2}
          fill={w.lit ? 'hsl(0,0%,72%)' : `hsl(0,0%,${bgL + 4}%)`}
          opacity={w.lit ? 0.85 : 0.35}
        />
      ))}

      {/* Scan lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={`sl${i}`}
          x1="0" y1={i * 7 + 3.5}
          x2="100" y2={i * 7 + 3.5}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.7"
        />
      ))}

      {/* Vignette */}
      <rect width="100" height="56" fill={`url(#${uid}-vig)`} />

      {/* Stance indicator dot */}
      {stanceColor && (
        <circle cx="94" cy="5" r="2.8" fill={stanceColor} opacity="0.9" />
      )}
    </svg>
  )
}

export function NewsImagePanel() {
  const newsArticles = useGameStore(s => s.newsArticles)
  const setView = useUIStore(s => s.setView)

  const latest = newsArticles
    .slice()
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 2)

  if (latest.length === 0) return null

  return (
    <div
      style={{
        borderTop: '2px solid var(--border-default)',
        padding: '10px 12px 14px',
        background: 'var(--bg-primary)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Press Coverage
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {latest.map(article => (
          <div
            key={article.id}
            data-testid={`press-card-${article.id}`}
            onClick={() => setView('news-feed')}
            style={{
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <div style={{ height: 56, overflow: 'hidden' }}>
              <ArticlePhoto articleId={article.id} stance={article.stance} />
            </div>
            <div style={{ padding: '5px 6px 6px', background: 'var(--bg-secondary)' }}>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {article.channel_name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.35,
                  maxHeight: '2.7em',
                  overflow: 'hidden',
                }}
              >
                {article.headline}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
