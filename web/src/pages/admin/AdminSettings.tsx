import { FormEvent, useEffect, useState } from 'react';
import { api, mediaUrl } from '../../api';
import type { Department } from '../../types';

export default function AdminSettings() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [message, setMessage] = useState('');

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
        {message && <p>{message}</p>}
        <button className="btn" type="submit">Save settings</button>
      </form>
    </div>
  );
}
