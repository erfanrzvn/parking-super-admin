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
  assignedParkingIds?: string[];
}

interface Parking {
  id: string;
  buildingCode: string;
  parkingName?: string;
  parkingNo: string;
  buildingName?: string;
}

export default function Admins() {
  const [admins, setAdmins] = useState<CognitoAdmin[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [showParkingAssign, setShowParkingAssign] = useState(false);
  const [selectedAdminForParking, setSelectedAdminForParking] = useState<CognitoAdmin | null>(null);
  const [selectedParkingIds, setSelectedParkingIds] = useState<string[]>([]);
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

      // Load parkings from DynamoDB
      const parkingsData = await client.models.Parking.list();
      setParkings(parkingsData.data as Parking[]);

      // Load admins from BOTH Cognito AND DynamoDB
      await loadAdminsFromBothSources();
    } catch (error) {
      console.error('Error loading data:', error);
      alert('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminsFromBothSources = async () => {
    // Load admins from Cognito using AWS SDK with Amplify credentials
    try {
      console.log('🔍 Loading admins from Cognito...');
      
      const { CognitoIdentityProviderClient, ListUsersCommand, AdminListGroupsForUserCommand } = 
        await import('@aws-sdk/client-cognito-identity-provider');
      const { fetchAuthSession } = await import('aws-amplify/auth');
      
      // Get credentials from Amplify
      const session = await fetchAuthSession();
      const credentials = session.credentials;
      
      if (!credentials) {
        throw new Error('No credentials available');
      }

      const cognitoClient = new CognitoIdentityProviderClient({
        region: 'ca-central-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      console.log('📞 Listing Cognito users...');
      
      const listCommand = new ListUsersCommand({
        UserPoolId: 'ca-central-1_UecP7kd1N',
        Limit: 60,
      });

      const response = await cognitoClient.send(listCommand);
      console.log(`📋 Found ${response.Users?.length || 0} total users`);

      const cognitoAdmins: CognitoAdmin[] = [];

      // Filter for BUILDING_ADMIN users
      for (const user of response.Users || []) {
        const attributes: Record<string, string> = {};
        for (const attr of user.Attributes || []) {
          if (attr.Name && attr.Value) {
            attributes[attr.Name] = attr.Value;
          }
        }

        // Only include BUILDING_ADMIN users
        if (attributes['custom:role'] === 'BUILDING_ADMIN') {
          // Get groups for this user
          let groups: string[] = [];
          try {
            const groupsCommand = new AdminListGroupsForUserCommand({
              UserPoolId: 'ca-central-1_UecP7kd1N',
              Username: user.Username,
            });
            const groupsResponse = await cognitoClient.send(groupsCommand);
            groups = (groupsResponse.Groups || []).map((g) => g.GroupName || '');
          } catch (error) {
            console.warn(`Could not get groups for ${user.Username}:`, error);
          }

          // Get parking assignments from DynamoDB Admin table
          let assignedParkingIds: string[] = [];
          try {
            const adminRecords = await client.models.Admin.list({
              filter: { email: { eq: attributes.email } },
            });
            if (adminRecords.data.length > 0) {
              assignedParkingIds = adminRecords.data[0].assignedParkingIds || [];
            }
          } catch (error) {
            console.warn(`Could not get parking assignments for ${attributes.email}:`, error);
          }

          cognitoAdmins.push({
            username: user.Username || '',
            email: attributes.email || '',
            buildingCode: attributes['custom:buildingCode'] || '',
            managerCode: attributes['custom:managerCode'] || '',
            managerName: attributes.name || attributes.email || '',
            phoneNo: attributes.phone_number || '',
            enabled: user.Enabled || false,
            status: user.UserStatus || 'UNKNOWN',
            createdAt: user.UserCreateDate?.toISOString() || new Date().toISOString(),
            assignedParkingIds,
          });
        }
      }

      console.log(`✅ Loaded ${cognitoAdmins.length} BUILDING_ADMIN users from Cognito`);
      setAdmins(cognitoAdmins);
    } catch (error: any) {
      console.error('❌ Error loading admins from Cognito:', error);
      console.error('Error details:', error.message);
      
      // Show user-friendly message
      alert(`خطا در بارگذاری ادمین‌ها از Cognito:\n\n${error.message}\n\nلطفاً console را چک کنید`);
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
      console.log('🚀 Creating admin with Cognito...');
      
      // Use the createAdminWithCognito mutation
      const result = await client.mutations.createAdminWithCognito({
        buildingCode: formData.buildingCode,
        managerCode: formData.managerCode,
        managerName: formData.managerName,
        email: formData.email,
        phoneNo: formData.phoneNo || null,
        buildingName: formData.buildingName || null,
        buildingNo: formData.buildingNo || null,
        address: formData.address || null,
      });

      console.log('📋 Result:', result);

      if (result.data?.success) {
        alert(`✅ Admin created successfully!\n\n👤 Username: ${result.data.cognitoUsername}\n🔑 Temporary Password: ${result.data.temporaryPassword}\n\n⚠️ User must change password on first login.`);
        resetForm();
        loadData();
      } else {
        alert(`❌ Failed: ${result.data?.message || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(`❌ خطا: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (admin: CognitoAdmin) => {
    setEditingUsername(admin.username);
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

  const handleAssignParkings = async (admin: CognitoAdmin) => {
    setSelectedAdminForParking(admin);
    setSelectedParkingIds(admin.assignedParkingIds || []);
    setShowParkingAssign(true);
  };

  const handleSaveParkingAssignments = async () => {
    if (!selectedAdminForParking) return;

    try {
      console.log('💾 Saving parking assignments...', {
        admin: selectedAdminForParking.email,
        parkings: selectedParkingIds,
      });

      // Find or create admin in DynamoDB
      const existingAdmins = await client.models.Admin.list({
        filter: { email: { eq: selectedAdminForParking.email } },
      });

      if (existingAdmins.data.length > 0) {
        // Update existing admin
        const adminId = existingAdmins.data[0].id;
        await client.models.Admin.update({
          id: adminId,
          assignedParkingIds: selectedParkingIds,
        });
        console.log('✅ Updated admin parking assignments');
      } else {
        // Create new admin record with parking assignments
        await client.models.Admin.create({
          buildingCode: selectedAdminForParking.buildingCode,
          managerCode: selectedAdminForParking.managerCode,
          managerName: selectedAdminForParking.managerName,
          email: selectedAdminForParking.email,
          phoneNo: selectedAdminForParking.phoneNo,
          cognitoUsername: selectedAdminForParking.username,
          assignedParkingIds: selectedParkingIds,
        });
        console.log('✅ Created admin record with parking assignments');
      }

      alert(`✅ Parking assignments saved successfully!\n\n${selectedParkingIds.length} parkings assigned to ${selectedAdminForParking.managerName}`);
      setShowParkingAssign(false);
      setSelectedAdminForParking(null);
      setSelectedParkingIds([]);
      await loadData(); // Reload to show updated assignments
    } catch (error: any) {
      console.error('❌ Error saving parking assignments:', error);
      alert(`❌ خطا در ذخیره: ${error.message}`);
    }
  };

  const toggleParkingSelection = (parkingId: string) => {
    if (selectedParkingIds.includes(parkingId)) {
      setSelectedParkingIds(selectedParkingIds.filter(id => id !== parkingId));
    } else {
      setSelectedParkingIds([...selectedParkingIds, parkingId]);
    }
  };

  const handleDelete = async (username: string, name: string) => {
    if (!confirm(`آیا از حذف ادمین "${name}" اطمینان دارید؟\n\nاین کار user را از Cognito حذف می‌کند و قابل بازگشت نیست!`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting admin from Cognito...', username);
      
      const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
      const { fetchAuthSession } = await import('aws-amplify/auth');
      
      // Get credentials from Amplify
      const session = await fetchAuthSession();
      const credentials = session.credentials;
      
      if (!credentials) {
        throw new Error('No credentials available');
      }

      const lambdaClient = new LambdaClient({
        region: 'ca-central-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      const payload = JSON.stringify({
        arguments: {
          username: username,
        },
      });

      const command = new InvokeCommand({
        FunctionName: 'amplify-parkingsystemshar-deleteadminfromcognito-temp123',
        Payload: new TextEncoder().encode(payload),
      });

      const response = await lambdaClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Payload));

      console.log('📋 Delete result:', result);

      if (result.success) {
        alert(`✅ ${result.message}`);
        loadData(); // Reload admins
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      alert(`❌ خطا در حذف: ${error.message}`);
    }
  };

  const handleSuspend = async (username: string, name: string, currentlyEnabled: boolean) => {
    const action = currentlyEnabled ? 'suspend' : 'enable';
    const actionPersian = currentlyEnabled ? 'تعلیق' : 'فعال‌سازی';
    
    if (!confirm(`آیا از ${actionPersian} ادمین "${name}" اطمینان دارید؟`)) {
      return;
    }

    try {
      console.log(`🔄 ${action}ing admin...`, username);
      
      const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
      const { fetchAuthSession } = await import('aws-amplify/auth');
      
      // Get credentials from Amplify
      const session = await fetchAuthSession();
      const credentials = session.credentials;
      
      if (!credentials) {
        throw new Error('No credentials available');
      }

      const lambdaClient = new LambdaClient({
        region: 'ca-central-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      const payload = JSON.stringify({
        arguments: {
          username: username,
          suspend: currentlyEnabled, // If currently enabled, suspend it
        },
      });

      const command = new InvokeCommand({
        FunctionName: 'amplify-parkingsystemshar-suspendadminincognito-temp456',
        Payload: new TextEncoder().encode(payload),
      });

      const response = await lambdaClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Payload));

      console.log('📋 Suspend/Enable result:', result);

      if (result.success) {
        alert(`✅ ${result.message}`);
        loadData(); // Reload admins
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error: any) {
      console.error('❌ Suspend/Enable error:', error);
      alert(`❌ خطا: ${error.message}`);
    }
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
    setEditingUsername(null);
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
          <h2>{editingUsername ? '📝 Edit Admin' : '➕ Add New Admin'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="buildingCode">Building *</label>
                <select
                  id="buildingCode"
                  required
                  value={formData.buildingCode}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  disabled={!!editingUsername}
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
                  disabled={!!editingUsername}
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
                  disabled={!!editingUsername}
                />
                <small>ایمیل برای ورود به سیستم</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  required={!editingUsername}
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
                {editingUsername ? '✅ Update Admin' : '➕ Create Admin'}
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
                    <span className="detail-icon">🅿️</span>
                    <span className="detail-value">
                      Assigned Parkings: {admin.assignedParkingIds?.length || 0}
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
                  <button className="btn-icon assign" onClick={() => handleAssignParkings(admin)}>
                    🅿️ Assign Parkings
                  </button>
                  <button className="btn-icon edit" onClick={() => handleEdit(admin)}>
                    📝 Edit
                  </button>
                  <button
                    className="btn-icon"
                    style={{ background: admin.enabled ? '#ff9800' : '#4caf50', color: 'white' }}
                    onClick={() => handleSuspend(admin.username, admin.managerName, admin.enabled)}
                    title={admin.enabled ? 'Suspend admin' : 'Enable admin'}
                  >
                    {admin.enabled ? '⏸️ Suspend' : '▶️ Enable'}
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(admin.username, admin.managerName)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parking Assignment Modal */}
      {showParkingAssign && selectedAdminForParking && (
        <div className="modal-overlay" onClick={() => setShowParkingAssign(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🅿️ Assign Parkings to {selectedAdminForParking.managerName}</h2>
              <button className="modal-close" onClick={() => setShowParkingAssign(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Select which parkings this admin can manage. They will only have access to these specific parkings.
              </p>

              <div className="parking-selection">
                {parkings
                  .filter((p) => p.buildingCode === selectedAdminForParking.buildingCode)
                  .map((parking) => (
                    <label key={parking.id} className="parking-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedParkingIds.includes(parking.id)}
                        onChange={() => toggleParkingSelection(parking.id)}
                      />
                      <div className="parking-info">
                        <strong>{parking.parkingName || parking.parkingNo}</strong>
                        <span className="parking-no">#{parking.parkingNo}</span>
                      </div>
                    </label>
                  ))}
                
                {parkings.filter((p) => p.buildingCode === selectedAdminForParking.buildingCode).length === 0 && (
                  <div className="empty-state-small">
                    <p>No parkings found for building {selectedAdminForParking.buildingCode}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={handleSaveParkingAssignments}>
                ✅ Save Assignments ({selectedParkingIds.length} selected)
              </button>
              <button className="btn-secondary" onClick={() => setShowParkingAssign(false)}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
