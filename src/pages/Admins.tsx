import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { Admin, Building } from '../types';
import './Admins.css';

const client = generateClient<Schema>();

export default function Admins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    buildingCode: '',
    managerCode: '',
    managerName: '',
    phoneNo: '',
    email: '',
    buildingName: '',
    buildingNo: '',
    address: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsData, buildingsData] = await Promise.all([
        client.models.Admin.list(),
        client.models.Building.list(),
      ]);
      setAdmins(adminsData.data as Admin[]);
      setBuildings(buildingsData.data as Building[]);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingChange = (buildingCode: string) => {
    const building = buildings.find((b) => b.buildingCode === buildingCode);
    if (building) {
      setFormData({
        ...formData,
        buildingCode,
        buildingName: building.buildingName,
        buildingNo: building.buildingNo,
        address: building.address,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update - only update DynamoDB record
        await client.models.Admin.update({
          id: editingId,
          ...formData,
        });
        alert('✅ ادمین با موفقیت ویرایش شد');
      } else {
        // Create - use custom mutation to create both Cognito user and DynamoDB record
        const result = await client.mutations.createAdminWithCognito({
          buildingCode: formData.buildingCode,
          managerCode: formData.managerCode,
          managerName: formData.managerName,
          email: formData.email,
          phoneNo: formData.phoneNo || undefined,
          buildingName: formData.buildingName || undefined,
          buildingNo: formData.buildingNo || undefined,
          address: formData.address || undefined,
        });

        if (result.data?.success) {
          const message = `✅ ادمین با موفقیت ایجاد شد!\n\n` +
            `📧 Email: ${formData.email}\n` +
            `🔑 Temporary Password: ${result.data.temporaryPassword}\n\n` +
            `⚠️ این رمز موقت را به ادمین ارسال کنید.`;
          alert(message);
          
          // Also log it to console for easy copy
          console.log('New Admin Created:');
          console.log('Email:', formData.email);
          console.log('Temporary Password:', result.data.temporaryPassword);
        } else {
          alert(`❌ ${result.data?.message || 'خطا در ایجاد ادمین'}`);
          return;
        }
      }

      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving admin:', error);
      alert(`❌ خطا در ذخیره ادمین: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingId(admin.id);
    setFormData({
      buildingCode: admin.buildingCode,
      managerCode: admin.managerCode,
      managerName: admin.managerName,
      phoneNo: admin.phoneNo || '',
      email: admin.email,
      buildingName: admin.buildingName || '',
      buildingNo: admin.buildingNo || '',
      address: admin.address || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف ادمین "${name}" اطمینان دارید؟`)) {
      return;
    }

    try {
      await client.models.Admin.delete({ id });
      alert('✅ ادمین با موفقیت حذف شد');
      loadData();
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('❌ خطا در حذف ادمین');
    }
  };

  const resetForm = () => {
    setFormData({
      buildingCode: '',
      managerCode: '',
      managerName: '',
      phoneNo: '',
      email: '',
      buildingName: '',
      buildingNo: '',
      address: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="admins-page">
      <div className="page-header">
        <div>
          <h1>👥 Building Admins Management</h1>
          <p className="page-subtitle">Manage building administrators</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '❌ Cancel' : '➕ Add Admin'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? '📝 Edit Admin' : '➕ Add New Admin'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="buildingCode">Building *</label>
                <select
                  id="buildingCode"
                  required
                  value={formData.buildingCode}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  disabled={!!editingId}
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.buildingCode}>
                      {building.buildingName} ({building.buildingCode})
                    </option>
                  ))}
                </select>
                <small>ساختمانی که این ادمین مدیریتش می‌کنه</small>
              </div>

              <div className="form-group">
                <label htmlFor="managerCode">Manager Code *</label>
                <input
                  id="managerCode"
                  type="text"
                  required
                  value={formData.managerCode}
                  onChange={(e) => setFormData({ ...formData, managerCode: e.target.value })}
                  placeholder="MGR001"
                  disabled={!!editingId}
                />
                <small>کد یکتا برای مدیر (مثلا MGR001)</small>
              </div>

              <div className="form-group">
                <label htmlFor="managerName">Manager Name *</label>
                <input
                  id="managerName"
                  type="text"
                  required
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="John Smith"
                />
                <small>نام کامل مدیر ساختمان</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@building1.com"
                />
                <small>ایمیل برای ورود به سیستم</small>
              </div>

              <div className="form-group">
                <label htmlFor="phoneNo">Phone Number</label>
                <input
                  id="phoneNo"
                  type="tel"
                  value={formData.phoneNo}
                  onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                  placeholder="+1-416-555-0100"
                />
                <small>شماره تماس (اختیاری)</small>
              </div>
            </div>

            {formData.buildingCode && (
              <div className="building-info">
                <h3>📋 Building Information</h3>
                <p>
                  <strong>Name:</strong> {formData.buildingName}
                </p>
                <p>
                  <strong>Number:</strong> {formData.buildingNo}
                </p>
                <p>
                  <strong>Address:</strong> {formData.address}
                </p>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Save Changes' : '✅ Add Admin'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admins-list">
        {admins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No admins yet</h3>
            <p>Click "Add Admin" to create your first building administrator</p>
          </div>
        ) : (
          <div className="admins-grid">
            {admins.map((admin) => (
              <div key={admin.id} className="admin-card">
                <div className="admin-header">
                  <div>
                    <h3>{admin.managerName}</h3>
                    <span className="admin-code">{admin.managerCode}</span>
                  </div>
                  <div className="building-badge">{admin.buildingCode}</div>
                </div>

                <div className="admin-details">
                  <div className="detail-row">
                    <span className="detail-icon">📧</span>
                    <span className="detail-value">{admin.email}</span>
                  </div>
                  {admin.phoneNo && (
                    <div className="detail-row">
                      <span className="detail-icon">📞</span>
                      <span className="detail-value">{admin.phoneNo}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-icon">🏢</span>
                    <span className="detail-value">
                      {admin.buildingName || 'N/A'} ({admin.buildingNo || 'N/A'})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span className="detail-value">{admin.address || 'N/A'}</span>
                  </div>
                </div>

                <div className="admin-actions">
                  <button className="btn-icon edit" onClick={() => handleEdit(admin)}>
                    📝 Edit
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(admin.id, admin.managerName)}
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
