import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api';

interface AdminRow {
  id: number;
  email: string;
  display_name: string;
  active: number;
  created_at: string;
  last_login: string | null;
}

export default function AdminUsers() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const data = await api.getAdmins();
    setAdmins(data.admins as AdminRow[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const display_name = String(form.get('display_name') ?? '');
    const password = String(form.get('password') ?? '');

    try {
      await api.createAdmin(email, display_name, password);
      event.currentTarget.reset();
      setMessage('Admin user created.');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create user');
    }
  }

  return (
    <div>
      <h1>Admin users</h1>
      <p className="meta-line">Multiple staff logins with the same admin permissions.</p>

      <table className="table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Last login</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.display_name}</td>
              <td>{admin.email}</td>
              <td>{admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="form-grid" style={{ marginTop: '2rem' }} onSubmit={handleSubmit}>
        <h2>Add admin login</h2>
        <label>
          Display name
          <input className="text-input" name="display_name" required />
        </label>
        <label>
          Email
          <input className="text-input" name="email" type="email" required />
        </label>
        <label>
          Password
          <input className="text-input" name="password" type="password" required />
        </label>
        {message && <p>{message}</p>}
        <button className="btn" type="submit">Add admin</button>
      </form>
    </div>
  );
}
