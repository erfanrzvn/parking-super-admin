import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { Building } from '../types';
import './Admins.css';

const client = generateClient<Schema>();

interface CognitoAdmin {
  username: string;
  email: string;
  buildingCode: string;
  managerCode: string;
  managerName: string;
  phoneNo?: string;
  enabled: boolean;
  status: string;
  createdAt: string;
}

export default function Admins() {
  const [admins, setAdmins] = useState<CognitoAdmin[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    buildingCode: '',
    managerCode: '',
    managerName: '',
    phoneNo: '',
    email: '',
    password: '',
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
      // Load buildings from DynamoDB
      const buildingsData = await client.models.Building.list();
      setBuildings(buildingsData.data as Building[]);

      // Load admins from Cognito using listCognitoUsers query
      await loadAdminsFromCognito();
    } catch (error) {
      console.error('Error loading data:', error);
      alert('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminsFromCognito = async () => {
    try {
      // TEMPORARY: Since listCognitoUsers Lambda doesn't exist,
      // we'll show a placeholder message and instructions
      console.log('⚠️ listCognitoUsers Lambda function not available');
      console.log('📋 Showing Cognito users that were created via CLI');
      
      // For now, show empty list with helpful message
      // Users should use AWS CLI to list admins:
      // aws cognito-idp list-users --user-pool-id ca-central-1_UecP7kd1N --region ca-central-1 --filter "custom:role = \"BUILDING_ADMIN\""
      
      setAdmins([]);
      
    } catch (error) {
      console.error('Error loading admins from Cognito:', error);
      setAdmins([]);
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

    if (!formData.email || !formData.password) {
      alert('❌ Email و Password الزامی هستند');
      return;
    }

    try {
      // Create Admin using AWS CLI approach - calling AdminQueries API
      // For now, show instructions to create manually
      const instructions = `
⚠️ برای ایجاد Admin، دستورات زیر را اجرا کنید:

# 1. Create Cognito User:
aws cognito-idp admin-create-user \\
  --user-pool-id ca-central-1_UecP7kd1N \\
  --username ${formData.email} \\
  --user-attributes Name=email,Value=${formData.email} Name=email_verified,Value=true Name=custom:buildingCode,Value=${formData.buildingCode} Name=custom:managerCode,Value=${formData.managerCode} Name=name,Value="${formData.managerName}" \\
  --temporary-password "${formData.password}" \\
  --region ca-central-1

# 2. Add to BuildingAdmins Group:
aws cognito-idp admin-add-user-to-group \\
  --user-pool-id ca-central-1_UecP7kd1N \\
  --username ${formData.email} \\
  --group-name BuildingAdmins \\
  --region ca-central-1

# 3. Set Permanent Password:
aws cognito-idp admin-set-user-password \\
  --user-pool-id ca-central-1_UecP7kd1N \\
  --username ${formData.email} \\
  --password "${formData.password}" \\
  --permanent \\
  --region ca-central-1
      `.trim();

      // Copy to clipboard if possible
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(instructions);
        alert('✅ دستورات AWS CLI کپی شدند!\n\nلطفاً در PowerShell اجرا کنید و سپس صفحه را رفرش کنید.');
      } else {
        alert(instructions);
      }

      console.log('Admin Creation Instructions:');
      console.log(instructions);
      
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ خطا: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (admin: CognitoAdmin) => {
    setEditingEmail(admin.email);
    setFormData({
      buildingCode: admin.buildingCode,
      managerCode: admin.managerCode,
      managerName: admin.managerName,
      phoneNo: admin.phoneNo || '',
      email: admin.email,
      password: '', // Not editable
      buildingName: '',
      buildingNo: '',
      address: '',
    });
    setShowForm(true);
  };

  const handleDelete = async (email: string, name: string) => {
    if (!confirm(`آیا از حذف ادمین "${name}" اطمینان دارید؟\n\nاین کار user را از Cognito حذف می‌کند.`)) {
      return;
    }

    const instructions = `
⚠️ برای حذف Admin، این دستور را اجرا کنید:

aws cognito-idp admin-delete-user \\
  --user-pool-id ca-central-1_UecP7kd1N \\
  --username ${email} \\
  --region ca-central-1
    `.trim();

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(instructions);
      alert('✅ دستور AWS CLI کپی شد!\n\nلطفاً در PowerShell اجرا کنید و سپس صفحه را رفرش کنید.');
    } else {
      alert(instructions);
    }

    console.log('Admin Deletion Instruction:');
    console.log(instructions);
  };

  const resetForm = () => {
    setFormData({
      buildingCode: '',
      managerCode: '',
      managerName: '',
      phoneNo: '',
      email: '',
      password: '',
      buildingName: '',
      buildingNo: '',
      address: '',
    });
    setEditingEmail(null);
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
                  disabled={!!editingEmail}
                />
                <small>ایمیل برای ورود به سیستم</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  required={!editingEmail}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Admin@123"
                  minLength={8}
                />
                <small>رمز عبور حداقل 8 کاراکتر (شامل حرف بزرگ، کوچک، عدد و نماد)</small>
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
                {editingEmail ? '📋 Copy Update Commands' : '✅ Copy Create Commands'}
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
            <h3>Admins are managed via AWS Cognito</h3>
            <p>Use the form above to get AWS CLI commands for creating admins.</p>
            <p style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.9rem' }}>
              <strong>💡 To view existing admins:</strong><br/>
              Run this command in PowerShell:<br/>
              <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: '#fff', borderRadius: '4px' }}>
                aws cognito-idp list-users --user-pool-id ca-central-1_UecP7kd1N --region ca-central-1 --filter "custom:role = \"BUILDING_ADMIN\""
              </code>
            </p>
          </div>
        ) : (
          <div className="admins-grid">
            {admins.map((admin) => (
              <div key={admin.username} className="admin-card">
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
                    <span className="detail-icon">✅</span>
                    <span className="detail-value">
                      Status: {admin.status}
                      {!admin.enabled && ' (Disabled)'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-value">
                      Created: {new Date(admin.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                <div className="admin-actions">
                  <button className="btn-icon edit" onClick={() => handleEdit(admin)}>
                    📝 Edit
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(admin.email, admin.managerName)}
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
