import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../shared/amplify/data/resource';
import './Dashboard.css';

const client = generateClient<Schema>();

interface Stats {
  totalBuildings: number;
  totalAdmins: number;
  totalUnits: number;
  totalParkings: number;
  totalReservations: number;
  activeReservations: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBuildings: 0,
    totalAdmins: 0,
    totalUnits: 0,
    totalParkings: 0,
    totalReservations: 0,
    activeReservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [buildings, admins, units, parkings, reservations] = await Promise.all([
        client.models.Building.list(),
        client.models.Admin.list(),
        client.models.UnitInfo.list(),
        client.models.Parking.list(),
        client.models.Reserving.list(),
      ]);

      const now = new Date();
      const activeReservations = reservations.data.filter((r) => {
        const reservationDate = new Date(r.dateTime);
        const endDate = new Date(reservationDate.getTime() + (r.duration || 0) * 60000);
        return now >= reservationDate && now <= endDate;
      }).length;

      setStats({
        totalBuildings: buildings.data.length,
        totalAdmins: admins.data.length,
        totalUnits: units.data.length,
        totalParkings: parkings.data.length,
        totalReservations: reservations.data.length,
        activeReservations,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard Overview</h1>
        <p className="dashboard-subtitle">System-wide statistics and quick access</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card buildings">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Total Buildings</h3>
            <p className="stat-value">{stats.totalBuildings}</p>
            <p className="stat-label">Managed buildings</p>
          </div>
        </div>

        <div className="stat-card admins">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Admins</h3>
            <p className="stat-value">{stats.totalAdmins}</p>
            <p className="stat-label">Building administrators</p>
          </div>
        </div>

        <div className="stat-card units">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <h3>Total Units</h3>
            <p className="stat-value">{stats.totalUnits}</p>
            <p className="stat-label">Residential units</p>
          </div>
        </div>

        <div className="stat-card parkings">
          <div className="stat-icon">🅿️</div>
          <div className="stat-content">
            <h3>Total Parkings</h3>
            <p className="stat-value">{stats.totalParkings}</p>
            <p className="stat-label">Parking spaces</p>
          </div>
        </div>

        <div className="stat-card reservations">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Total Reservations</h3>
            <p className="stat-value">{stats.totalReservations}</p>
            <p className="stat-label">All time reservations</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Now</h3>
            <p className="stat-value">{stats.activeReservations}</p>
            <p className="stat-label">Current reservations</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary">
            <span className="action-icon">🏢</span>
            <span className="action-label">Add Building</span>
          </button>
          <button className="action-btn secondary">
            <span className="action-icon">👤</span>
            <span className="action-label">Add Admin</span>
          </button>
          <button className="action-btn secondary">
            <span className="action-icon">🏠</span>
            <span className="action-label">Add Unit</span>
          </button>
          <button className="action-btn secondary">
            <span className="action-icon">🅿️</span>
            <span className="action-label">Add Parking</span>
          </button>
        </div>
      </div>
    </div>
  );
}
