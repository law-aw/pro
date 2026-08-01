import { FormEvent, useEffect, useState } from 'react';
import { api, mediaUrl } from '../../api';
import type { Department } from '../../types';

export default function AdminSettings() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => setDepartment(data.department));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await api.updateSettings(formData);
    setDepartment(result.department);
    document.documentElement.style.setProperty('--accent', result.department.accent_color);
    setMessage('Settings saved.');
  }

  async function handleExitKiosk() {
    setLoading(true);
    try {
      await api.exitKiosk();
      setMessage('Exiting kiosk mode on display board...');
      setTimeout(() => {
        setMessage('Kiosk mode exited. The display will restart.');
      }, 1000);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to exit kiosk mode'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFullscreen() {
    setLoading(true);
    try {
      await api.toggleFullscreen();
      setMessage('Fullscreen toggle sent to display board...');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to toggle fullscreen'}`);
    } finally {
      setLoading(false);
    }
  }

  if (!department) return <div>Loading settings…</div>;

  return (
    <div>
      <h1>Department settings</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          University name
          <input className="text-input" name="university_name" defaultValue={department.university_name} />
        </label>
        <label>
          Department name
          <input className="text-input" name="department_name" defaultValue={department.department_name} />
        </label>
        <label>
          Accent color
          <input className="text-input" name="accent_color" type="color" defaultValue={department.accent_color} />
        </label>
        <label>
          Department logo
          <input className="text-input" name="logo" type="file" accept="image/*" />
        </label>
        {department.logo_path && (
          <img src={mediaUrl(department.logo_path)!} alt="Current logo" style={{ maxWidth: '8rem' }} />
        )}
        {message && <p style={{ color: message.includes('Error') ? '#e74c3c' : '#27ae60' }}>{message}</p>}
        <button className="btn" type="submit">Save settings</button>
      </form>

      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #ddd' }}>
        <h2>Kiosk Display Control</h2>
        <p>These buttons control the display board running in kiosk mode.</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            style={{ backgroundColor: '#e74c3c' }}
            onClick={handleExitKiosk}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Exit Kiosk Mode'}
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: '#3498db' }}
            onClick={handleToggleFullscreen}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Toggle Fullscreen'}
          </button>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '1rem' }}>
          <strong>Exit Kiosk Mode:</strong> Terminates the fullscreen browser and allows desktop access. The display will automatically restart the kiosk after a brief moment.
        </p>
      </div>
    </div>
  );
}
