import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import './ParkingSpots.css';

const client = generateClient<Schema>();

interface ParkingSpot {
  id: string;
  parkingId: string;
  spotNumber: string;
  spotType?: 'ELECTRIC' | 'REGULAR' | 'GUEST';
  isAvailable?: boolean;
  buildingCode: string;
  floor?: string;
  section?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ParkingSpotsProps {
  parkingId: string;
  parkingName: string;
  parkingNo: string;
  onBack: () => void;
}

export default function ParkingSpots({ parkingId, parkingName, parkingNo, onBack }: ParkingSpotsProps) {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    spotNumber: '',
    spotType: 'REGULAR' as 'ELECTRIC' | 'REGULAR' | 'GUEST',
    isAvailable: true,
    floor: '',
    section: '',
    description: '',
  });

  useEffect(() => {
    loadSpots();
  }, [parkingId]);

  const loadSpots = async () => {
    setLoading(true);
    try {
      const spotsData = await client.models.ParkingSpot.list({
        filter: { parkingId: { eq: parkingId } }
      });
      
      setSpots(spotsData.data as ParkingSpot[]);
    } catch (error) {
      console.error('Error loading spots:', error);
      alert('خطا در بارگذاری spots');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get buildingCode from parking
      const parkingData = await client.models.Parking.get({ id: parkingId });
      if (!parkingData.data) {
        alert('خطا: پارکینگ پیدا نشد');
        return;
      }

      const dataWithParking = {
        ...formData,
        parkingId,
        buildingCode: parkingData.data.buildingCode,
        floor: formData.floor || undefined,
        section: formData.section || undefined,
        description: formData.description || undefined,
      };

      if (editingId) {
        await client.models.ParkingSpot.update({
          id: editingId,
          ...dataWithParking,
        });
        alert('✅ Spot با موفقیت ویرایش شد');
      } else {
        await client.models.ParkingSpot.create(dataWithParking);
        alert('✅ Spot با موفقیت اضافه شد');
      }

      resetForm();
      loadSpots();
    } catch (error) {
      console.error('Error saving spot:', error);
      alert('❌ خطا در ذخیره spot');
    }
  };

  const handleEdit = (spot: ParkingSpot) => {
    setEditingId(spot.id);
    setFormData({
      spotNumber: spot.spotNumber,
      spotType: spot.spotType || 'REGULAR',
      isAvailable: spot.isAvailable ?? true,
      floor: spot.floor || '',
      section: spot.section || '',
      description: spot.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, spotNumber: string) => {
    if (!confirm(`آیا از حذف Spot "${spotNumber}" اطمینان دارید؟`)) {
      return;
    }

    try {
      await client.models.ParkingSpot.delete({ id });
      alert('✅ Spot با موفقیت حذف شد');
      loadSpots();
    } catch (error) {
      console.error('Error deleting spot:', error);
      alert('❌ خطا در حذف spot');
    }
  };

  const resetForm = () => {
    setFormData({
      spotNumber: '',
      spotType: 'REGULAR',
      isAvailable: true,
      floor: '',
      section: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const availableSpots = spots.filter((s) => s.isAvailable).length;

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading spots...</p>
      </div>
    );
  }

  return (
    <div className="parking-spots-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={onBack}>
            ← بازگشت
          </button>
          <h1>🅿️ Parking Spots - {parkingName || parkingNo}</h1>
          <p className="page-subtitle">
            Parking: <strong>{parkingNo}</strong> | {spots.length} spot{spots.length !== 1 ? 's' : ''}, {availableSpots} available
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '❌ Cancel' : '➕ Add Spot'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? '📝 Edit Spot' : '➕ Add New Spot'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="spotNumber">Spot Number *</label>
                <input
                  id="spotNumber"
                  type="text"
                  required
                  value={formData.spotNumber}
                  onChange={(e) => setFormData({ ...formData, spotNumber: e.target.value })}
                  placeholder="A1, A2, B1..."
                  disabled={!!editingId}
                />
                <small>شماره جای پارک (مثلاً A1، B2)</small>
              </div>

              <div className="form-group">
                <label htmlFor="spotType">Spot Type *</label>
                <select
                  id="spotType"
                  value={formData.spotType}
                  onChange={(e) =>
                    setFormData({ ...formData, spotType: e.target.value as any })
                  }
                >
                  <option value="REGULAR">🚗 Regular</option>
                  <option value="ELECTRIC">⚡ Electric</option>
                  <option value="GUEST">👥 Guest</option>
                </select>
                <small>نوع جای پارک</small>
              </div>

              <div className="form-group">
                <label htmlFor="section">Section</label>
                <input
                  id="section"
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="A, B, C..."
                />
                <small>بخش (اختیاری)</small>
              </div>

              <div className="form-group">
                <label htmlFor="floor">Floor</label>
                <input
                  id="floor"
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="1, 2, B1..."
                />
                <small>طبقه (اختیاری)</small>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.checked })
                    }
                  />
                  <span style={{ marginLeft: '8px' }}>Available</span>
                </label>
                <small>آیا این spot در دسترس است؟</small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
                <small>توضیحات (اختیاری)</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Save Changes' : '✅ Add Spot'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="spots-stats">
        <div className="stat-item">
          <span className="stat-label">Total Spots:</span>
          <span className="stat-value">{spots.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Available:</span>
          <span className="stat-value available">{availableSpots}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Occupied:</span>
          <span className="stat-value occupied">{spots.length - availableSpots}</span>
        </div>
      </div>

      <div className="spots-list">
        {spots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🅿️</div>
            <h3>No spots yet</h3>
            <p>Click "Add Spot" to create parking spots</p>
          </div>
        ) : (
          <div className="spots-grid">
            {spots.map((spot) => {
              const typeIcon =
                spot.spotType === 'ELECTRIC'
                  ? '⚡'
                  : spot.spotType === 'GUEST'
                  ? '👥'
                  : '🚗';
              
              return (
                <div
                  key={spot.id}
                  className={`spot-card ${spot.isAvailable ? 'available' : 'occupied'}`}
                >
                  <div className="spot-header">
                    <div>
                      <h3>
                        {typeIcon} {spot.spotNumber}
                      </h3>
                      <span className={`status-badge ${spot.isAvailable ? 'available' : 'occupied'}`}>
                        {spot.isAvailable ? '✅ Available' : '🚫 Occupied'}
                      </span>
                    </div>
                  </div>

                  <div className="spot-details">
                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-value">
                        {spot.section && `Section ${spot.section}`}
                        {spot.section && spot.floor && ' • '}
                        {spot.floor && `Floor ${spot.floor}`}
                        {!spot.section && !spot.floor && 'No location'}
                      </span>
                    </div>
                    {spot.description && (
                      <div className="detail-row">
                        <span className="detail-icon">📝</span>
                        <span className="detail-value">{spot.description}</span>
                      </div>
                    )}
                    {spot.createdAt && (
                      <div className="detail-row">
                        <span className="detail-icon">📅</span>
                        <span className="detail-value">
                          Created: {new Date(spot.createdAt).toLocaleDateString('en-CA')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="spot-actions">
                    <button className="btn-icon edit" onClick={() => handleEdit(spot)}>
                      📝 Edit
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(spot.id, spot.spotNumber)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
