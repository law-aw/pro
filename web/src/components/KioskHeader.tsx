import { useEffect, useState } from 'react';
import { api, mediaUrl } from '../api';
import type { Department } from '../types';
import logo from '../assets/images.jfif';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function KioskHeader({ search, onSearchChange }: Props) {
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    api.getSettings().then((data) => {
      setDepartment(data.department);
      document.documentElement.style.setProperty('--accent', data.department.accent_color);
    });
  }, []);

  return (
    <header className="header">
      <img className="brand-logo" src={logo} alt="Department logo" />
      <div className="brand-text">
        <h1>{department?.department_name ?? 'Electrical Engineering'}</h1>
        <p>{department?.university_name ?? 'Southern Delta University'}</p>
      </div>
      <div className="header-actions">
        <input
          className="search-input"
          style={{ width: 'min(100%, 18rem)' }}
          placeholder="Search notices..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </header>
  );
}
