import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function AdminSync() {
  const [status, setStatus] = useState<{
    role: string;
    hubConfigured: boolean;
    syncHubUrl: string | null;
    lastSyncAt: string | null;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await api.syncStatus();
    setStatus(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function syncNow() {
    setLoading(true);
    setMessage('');
    try {
      if (status?.role === 'edge') {
        const result = await api.syncPull();
        setMessage(result.message);
      } else if (status?.role === 'hub') {
        const result = await api.syncPush();
        setMessage(`Pushed version ${result.version}. Edge devices will sync on next interval.`);
      }
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  if (!status) return <div>Loading sync status…</div>;

  return (
    <div>
      <h1>Sync</h1>
      <p className="meta-line">
        {status.role === 'hub'
          ? 'Push notice updates to connected edge devices, or configure sync hub settings.'
          : 'Update notices on department Wi‑Fi directly on this device, or from home via the sync hub when the Pi has internet.'}
      </p>

      <div className="detail-panel" style={{ marginTop: '1.5rem' }}>
        <p><strong>Device role:</strong> {status.role}</p>
        <p><strong>Hub configured:</strong> {status.hubConfigured ? 'Yes' : 'No'}</p>
        <p><strong>Hub URL:</strong> {status.syncHubUrl ?? 'Not set'}</p>
        <p><strong>Last sync:</strong> {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}</p>
      </div>

      <div className="chip-row" style={{ marginTop: '1rem' }}>
        <button className="btn" type="button" onClick={syncNow} disabled={loading}>
          {loading ? 'Syncing...' : 'Sync now'}
        </button>
      </div>

      {message && <p style={{ marginTop: '1rem', fontWeight: 500 }}>{message}</p>}

      <div className="detail-panel" style={{ marginTop: '2rem' }}>
        <h2>How {status.role === 'hub' ? 'hub push' : 'remote'} updates work</h2>
        {status.role === 'hub' ? (
          <ol>
            <li>Create or edit notices on this admin panel.</li>
            <li>Click <strong>"Sync now"</strong> to push updates to all connected edge devices.</li>
            <li>Edge devices will fetch the latest notices on their next sync interval.</li>
            <li>Alternatively, edge devices can pull manually by clicking "Sync now" on their local admin panel.</li>
          </ol>
        ) : (
          <ol>
            <li>Host the same app online with <code>ROLE=hub</code>.</li>
            <li>Log in from home and manage notices there.</li>
            <li>Set the same <code>SYNC_API_KEY</code> on both hub and Pi.</li>
            <li>On the Pi, set <code>SYNC_HUB_URL</code> to your hub address.</li>
            <li>The Pi pulls updates automatically every 2 minutes when online, or click "Sync now" to pull immediately.</li>
          </ol>
        )}
        <p className="meta-line">
          {status.role === 'edge'
            ? 'On department Wi‑Fi you can also open the Pi directly at its local address — no internet required.'
            : 'Make sure edge devices have SYNC_HUB_URL and SYNC_API_KEY configured to receive updates.'}
        </p>
      </div>
    </div>
  );
}
