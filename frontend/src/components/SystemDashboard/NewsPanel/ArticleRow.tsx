import { useTranslation } from 'react-i18next'
import type { NewsArticle, NewsStance } from '@/types/game'

interface ArticleRowProps {
  article: NewsArticle
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const published = new Date(isoString).getTime()
  const diffMs = now - published

  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) return `${diffSeconds}s ago`

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function stanceBadgeStyle(stance: NewsStance): React.CSSProperties {
  switch (stance) {
    case 'critical':
      return {
        color: 'var(--color-red)',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
      }
    case 'state_friendly':
      return {
        color: 'var(--color-green)',
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
      }
    case 'independent':
    default:
      return {
        color: 'var(--text-muted)',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
      }
  }
}

export function ArticleRow({ article }: ArticleRowProps) {
  const { t } = useTranslation()

  const stanceLabel =
    article.stance === 'critical' ? t('news.stance.critical') :
    article.stance === 'state_friendly' ? t('news.stance.state_friendly') :
    t('news.stance.independent')

  const truncatedHeadline =
    article.headline.length > 90
      ? article.headline.slice(0, 90) + '…'
      : article.headline

  return (
    <div
      data-testid="article-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '5px 10px',
        padding: '9px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Top row: channel + stance badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 140,
          }}
        >
          {article.channel_name}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            padding: '1px 5px',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            ...stanceBadgeStyle(article.stance),
          }}
        >
          {stanceLabel}
        </span>
      </div>

      {/* Timestamp top-right */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          textAlign: 'right',
        }}
      >
        {formatRelativeTime(article.published_at)}
      </span>

      {/* Headline spans both columns */}
      <div
        style={{
          gridColumn: '1 / -1',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
        }}
      >
        {truncatedHeadline}
      </div>
    </div>
  )
}
