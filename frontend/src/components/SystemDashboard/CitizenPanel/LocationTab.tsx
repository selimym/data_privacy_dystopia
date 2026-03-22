import type { LocationRecord } from '@/types/citizen'

interface LocationTabProps {
  location: LocationRecord
}

export function LocationTab({ location }: LocationTabProps) {
  return (
    <div data-testid="location-tab" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Home
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>{location.home_address}</div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Work
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          {location.work_name} — {location.work_address}
        </div>
      </div>

      {location.flagged_locations.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--color-red)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Flagged Locations
          </div>
          <div style={{ color: 'var(--color-red)' }}>{location.flagged_locations.join(', ')}</div>
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Check-ins
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Location</th>
            <th>Type</th>
            <th>Frequency</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {location.checkins.map((c, i) => (
            <tr key={i}>
              <td>{c.date}</td>
              <td>{c.location_name}</td>
              <td>{c.location_type}</td>
              <td>{c.frequency}</td>
              <td>{c.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
