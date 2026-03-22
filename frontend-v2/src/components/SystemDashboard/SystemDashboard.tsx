import '@/styles/dashboard.css'
import { CinematicOverlay } from '@/components/shared'
import DashboardHeader from './Header/DashboardHeader'
import ContractBanner from './Header/ContractBanner'
import AutoFlagBanner from './Header/AutoFlagBanner'
import WorldMapContainer from './WorldMapContainer/WorldMapContainer'
import { DirectivePanel } from './DirectivePanel/DirectivePanel'
import { CitizenQueue } from './CitizenQueue/CitizenQueue'
import { CitizenPanel } from './CitizenPanel/CitizenPanel'
import { MetricsPanel } from './MetricsPanel/MetricsPanel'
import { NewsPanel } from './NewsPanel/NewsPanel'
import { AlertsPanel } from './AlertsPanel/AlertsPanel'

export default function SystemDashboard() {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <DashboardHeader />
        <ContractBanner />
        <AutoFlagBanner />
      </header>

      <aside className="dashboard-left">
        <DirectivePanel />
        <CitizenQueue />
      </aside>

      <main className="dashboard-center">
        <CitizenPanel />
      </main>

      <aside className="dashboard-right">
        <MetricsPanel />
        <AlertsPanel />
        <NewsPanel />
      </aside>

      <div className="dashboard-worldmap">
        {/* Phase 7 will add Phaser world map */}
        <WorldMapContainer />
      </div>

      <CinematicOverlay />
    </div>
  )
}
