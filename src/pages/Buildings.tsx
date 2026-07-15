import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { Building } from '../types';
import './Buildings.css';

const client = generateClient<Schema>();

export default function Buildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    buildingCode: '',
    buildingName: '',
    buildingNo: '',
    address: '',
    location: '',
  });

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Building.list();
      setBuildings(data as Building[]);
    } catch (error) {
      console.error('Error loading buildings:', error);
      alert('خطا در بارگذاری ساختمان‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update
        await client.models.Building.update({
          id: editingId,
          ...formData,
        });
        alert('✅ ساختمان با موفقیت ویرایش شد');
      } else {
        // Create
        await client.models.Building.create(formData);
        alert('✅ ساختمان با موفقیت اضافه شد');
      }
      
      resetForm();
      loadBuildings();
    } catch (error) {
      console.error('Error saving building:', error);
      alert('❌ خطا در ذخیره ساختمان');
    }
  };

  const handleEdit = (building: Building) => {
    setEditingId(building.id);
    setFormData({
      buildingCode: building.buildingCode,
      buildingName: building.buildingName,
      buildingNo: building.buildingNo,
      address: building.address,
      location: building.location || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف ساختمان "${name}" اطمینان دارید؟`)) {
      return;
    }

    try {
      await client.models.Building.delete({ id });
      alert('✅ ساختمان با موفقیت حذف شد');
      loadBuildings();
    } catch (error) {
      console.error('Error deleting building:', error);
      alert('❌ خطا در حذف ساختمان');
    }
  };

  const resetForm = () => {
    setFormData({
      buildingCode: '',
      buildingName: '',
      buildingNo: '',
      address: '',
      location: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading buildings...</p>
      </div>
    );
  }

  return (
    <div className="buildings-page">
      <div className="page-header">
        <div>
          <h1>🏢 Buildings Management</h1>
          <p className="page-subtitle">Manage all buildings in the system</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Cancel' : '➕ Add Building'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? '📝 Edit Building' : '➕ Add New Building'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="buildingCode">Building Code *</label>
                <input
                  id="buildingCode"
                  type="text"
                  required
                  value={formData.buildingCode}
                  onChange={(e) => setFormData({ ...formData, buildingCode: e.target.value })}
                  placeholder="BLD001"
                  disabled={!!editingId}
                />
                <small>کد یکتا برای ساختمان (مثلا BLD001)</small>
              </div>

              <div className="form-group">
                <label htmlFor="buildingName">Building Name *</label>
                <input
                  id="buildingName"
                  type="text"
                  required
                  value={formData.buildingName}
                  onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                  placeholder="Maple Heights"
                />
                <small>نام ساختمان</small>
              </div>

              <div className="form-group">
                <label htmlFor="buildingNo">Building Number *</label>
                <input
                  id="buildingNo"
                  type="text"
                  required
                  value={formData.buildingNo}
                  onChange={(e) => setFormData({ ...formData, buildingNo: e.target.value })}
                  placeholder="100"
                />
                <small>شماره ساختمان</small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Address *</label>
                <input
                  id="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="100 Main Street, Toronto, ON"
                />
                <small>آدرس کامل ساختمان</small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="location">Location (Optional)</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="43.6532,-79.3832"
                />
                <small>مختصات جغرافیایی (Latitude,Longitude)</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Save Changes' : '✅ Add Building'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="buildings-list">
        {buildings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No buildings yet</h3>
            <p>Click "Add Building" to create your first building</p>
          </div>
        ) : (
          <div className="buildings-grid">
            {buildings.map((building) => (
              <div key={building.id} className="building-card">
                <div className="building-header">
                  <h3>{building.buildingName}</h3>
                  <span className="building-code">{building.buildingCode}</span>
                </div>

                <div className="building-details">
                  <div className="detail-row">
                    <span className="detail-label">Building No:</span>
                    <span className="detail-value">{building.buildingNo}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{building.address}</span>
                  </div>
                  {building.location && (
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{building.location}</span>
                    </div>
                  )}
                  {building.createdAt && (
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">
                        {new Date(building.createdAt).toLocaleDateString('en-CA')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="building-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => handleEdit(building)}
                    title="Edit"
                  >
                    📝 Edit
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(building.id, building.buildingName)}
                    title="Delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
