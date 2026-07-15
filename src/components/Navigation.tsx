import { useState } from 'react';
import './Navigation.css';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userEmail?: string;
}

export default function Navigation({ currentPage, onNavigate, onSignOut, userEmail }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'buildings', label: 'Buildings', icon: '🏢' },
    { id: 'admins', label: 'Admins', icon: '👥' },
    { id: 'units', label: 'Units', icon: '🏠' },
    { id: 'parkings', label: 'Parkings', icon: '🅿️' },
    { id: 'reservations', label: 'Reservations', icon: '📅' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-logo">🏢 Super Admin</h1>
        <button 
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => {
              onNavigate(item.id);
              setMenuOpen(false);
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-footer">
        <div className="nav-user">
          <span className="user-icon">👤</span>
          <span className="user-email">{userEmail}</span>
        </div>
        <button className="nav-signout" onClick={onSignOut}>
          🚪 Sign Out
        </button>
      </div>
    </nav>
  );
}
