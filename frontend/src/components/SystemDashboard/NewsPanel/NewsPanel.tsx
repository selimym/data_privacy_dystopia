import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { ArticleRow } from './ArticleRow'

const MAX_ARTICLES = 10

export function NewsPanel() {
  const { t } = useTranslation()
  const newsArticles = useGameStore(s => s.newsArticles)

  const displayed = newsArticles
    .slice()
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, MAX_ARTICLES)

  return (
    <div className="panel" data-testid="news-panel">
      <div className="panel-title">{t('news.title')}</div>

      <div style={{ padding: '0 12px 10px' }}>
        {displayed.length === 0 ? (
          <div
            style={{
              padding: '12px 0',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}
          >
            {t('common.loading')}
          </div>
        ) : (
          displayed.map(article => (
            <ArticleRow key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  )
}
