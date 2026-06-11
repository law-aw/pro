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

  async function load() {
    const data = await api.syncStatus();
    setStatus(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function pullNow() {
    const result = await api.syncPull();
    setMessage(result.message);
    await load();
  }

  if (!status) return <div>Loading sync status…</div>;

  return (
    <div>
      <h1>Sync</h1>
      <p className="meta-line">
        Update notices on department Wi‑Fi directly on this device, or from home via the sync hub when the Pi has internet.
      </p>

      <div className="detail-panel" style={{ marginTop: '1.5rem' }}>
        <p><strong>Device role:</strong> {status.role}</p>
        <p><strong>Hub configured:</strong> {status.hubConfigured ? 'Yes' : 'No'}</p>
        <p><strong>Hub URL:</strong> {status.syncHubUrl ?? 'Not set'}</p>
        <p><strong>Last sync:</strong> {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}</p>
      </div>

      {status.role === 'edge' && (
        <div className="chip-row" style={{ marginTop: '1rem' }}>
          <button className="btn" type="button" onClick={pullNow}>Sync now</button>
        </div>
      )}

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}

      <div className="detail-panel" style={{ marginTop: '2rem' }}>
        <h2>How remote updates work</h2>
        <ol>
          <li>Host the same app online with <code>ROLE=hub</code>.</li>
          <li>Log in from home and manage notices there.</li>
          <li>Set the same <code>SYNC_API_KEY</code> on both hub and Pi.</li>
          <li>On the Pi, set <code>SYNC_HUB_URL</code> to your hub address.</li>
          <li>The Pi pulls updates automatically every 2 minutes when online.</li>
        </ol>
        <p className="meta-line">
          On department Wi‑Fi you can also open the Pi directly at its local address — no internet required.
        </p>
      </div>
    </div>
  );
}
