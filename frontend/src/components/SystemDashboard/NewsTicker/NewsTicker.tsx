/**
 * NewsTicker — ambient 1-line scrolling news strip at the bottom of the dashboard.
 * Always visible (except in news-feed view where full articles are shown).
 * Clicking jumps to the NEWS FEED view.
 */
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'

export function NewsTicker() {
  const newsArticles = useGameStore(s => s.newsArticles)
  const currentView = useUIStore(s => s.currentView)
  const setView = useUIStore(s => s.setView)

  // Hide in news-feed view — redundant there
  if (currentView === 'news-feed') return null

  const latest = newsArticles
    .slice()
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 6)

  const tickerText = latest.length === 0
    ? 'NO REPORTS FILED — BEGIN CASE REVIEW TO GENERATE INTELLIGENCE FEED'
    : latest.map(a => `${a.channel_name.toUpperCase()} · ${a.headline}`).join('   ·   ')

  // Duplicate text for seamless loop
  const fullText = `${tickerText}          ${tickerText}          `

  return (
    <div
      data-testid="news-ticker"
      className="dashboard-ticker"
      onClick={() => setView('news-feed')}
      title="Open news feed"
      style={{ cursor: 'pointer' }}
    >
      <div className="news-ticker-label">LIVE FEED</div>
      <div className="news-ticker-track">
        <div className="news-ticker-content">
          {fullText}
        </div>
      </div>
    </div>
  )
}
