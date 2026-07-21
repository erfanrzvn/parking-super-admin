import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import './EditAdmin.css';

const client = generateClient<Schema>();

interface Parking {
  id: string;
  buildingCode: string;
  parkingName?: string;
  parkingNo: string;
  buildingName?: string;
}

interface EditAdminProps {
  adminUsername: string;
  onBack: () => void;
}

export default function EditAdmin({ adminUsername, onBack }: EditAdminProps) {
  const [admin, setAdmin] = useState<any>(null);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [selectedParkingIds, setSelectedParkingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    managerName: '',
    phoneNo: '',
  });

  useEffect(() => {
    loadAdminData();
  }, [adminUsername]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading admin data...', adminUsername);

      // Load admin from Cognito
      const { CognitoIdentityProviderClient, AdminGetUserCommand } = 
        await import('@aws-sdk/client-cognito-identity-provider');
      const { fetchAuthSession } = await import('aws-amplify/auth');

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

      const userCommand = new AdminGetUserCommand({
        UserPoolId: 'ca-central-1_UecP7kd1N',
        Username: adminUsername,
      });

      const userResponse = await cognitoClient.send(userCommand);
      
      const attributes: Record<string, string> = {};
      for (const attr of userResponse.UserAttributes || []) {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      }

      // Get parking assignments from DynamoDB
      let assignedParkingIds: string[] = [];
      const adminRecords = await client.models.Admin.list({
        filter: { email: { eq: attributes.email } },
      });
      if (adminRecords.data.length > 0) {
        assignedParkingIds = adminRecords.data[0].assignedParkingIds || [];
      }

      const adminData = {
        username: userResponse.Username || '',
        email: attributes.email || '',
        buildingCode: attributes['custom:buildingCode'] || '',
        managerCode: attributes['custom:managerCode'] || '',
        managerName: attributes.name || attributes.email || '',
        phoneNo: attributes.phone_number || '',
        assignedParkingIds,
      };

      setAdmin(adminData);
      setFormData({
        managerName: adminData.managerName,
        phoneNo: adminData.phoneNo,
      });
      setSelectedParkingIds(assignedParkingIds);

      // Load parkings for this building
      const parkingsData = await client.models.Parking.list({
        filter: { buildingCode: { eq: adminData.buildingCode } },
      });
      setParkings(parkingsData.data as Parking[]);

      console.log('✅ Admin data loaded:', adminData);
    } catch (error: any) {
      console.error('❌ Error loading admin:', error);
      alert(`خطا در بارگذاری اطلاعات: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleParkingSelection = (parkingId: string) => {
    if (selectedParkingIds.includes(parkingId)) {
      setSelectedParkingIds(selectedParkingIds.filter(id => id !== parkingId));
    } else {
      setSelectedParkingIds([...selectedParkingIds, parkingId]);
    }
  };

  const handleSave = async () => {
    if (!admin) return;

    setSaving(true);
    try {
      console.log('💾 Saving admin updates...', {
        formData,
        parkings: selectedParkingIds,
      });

      // Update Cognito attributes if changed
      if (formData.managerName !== admin.managerName || formData.phoneNo !== admin.phoneNo) {
        const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = 
          await import('@aws-sdk/client-cognito-identity-provider');
        const { fetchAuthSession } = await import('aws-amplify/auth');

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

        const attributes = [];
        if (formData.managerName !== admin.managerName) {
          attributes.push({ Name: 'name', Value: formData.managerName });
        }
        if (formData.phoneNo !== admin.phoneNo) {
          attributes.push({ Name: 'phone_number', Value: formData.phoneNo || '' });
        }

        if (attributes.length > 0) {
          const updateCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: 'ca-central-1_UecP7kd1N',
            Username: adminUsername,
            UserAttributes: attributes,
          });

          await cognitoClient.send(updateCommand);
          console.log('✅ Updated Cognito attributes');
        }
      }

      // Update parking assignments in DynamoDB
      const existingAdmins = await client.models.Admin.list({
        filter: { email: { eq: admin.email } },
      });

      if (existingAdmins.data.length > 0) {
        // Update existing admin
        const adminId = existingAdmins.data[0].id;
        await client.models.Admin.update({
          id: adminId,
          assignedParkingIds: selectedParkingIds,
          managerName: formData.managerName,
          phoneNo: formData.phoneNo || undefined,
        });
        console.log('✅ Updated admin record');
      } else {
        // Create new admin record
        await client.models.Admin.create({
          buildingCode: admin.buildingCode,
          managerCode: admin.managerCode,
          managerName: formData.managerName,
          email: admin.email,
          phoneNo: formData.phoneNo || undefined,
          cognitoUsername: admin.username,
          assignedParkingIds: selectedParkingIds,
        });
        console.log('✅ Created admin record');
      }

      alert(`✅ تغییرات با موفقیت ذخیره شد!\n\n${selectedParkingIds.length} پارکینگ به ${formData.managerName} اختصاص داده شد.`);
      onBack();
    } catch (error: any) {
      console.error('❌ Error saving:', error);
      alert(`❌ خطا در ذخیره: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading admin data...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="error-state">
        <h2>❌ Admin not found</h2>
        <button className="btn-primary" onClick={onBack}>
          ← بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="edit-admin-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={onBack}>
            ← بازگشت
          </button>
          <h1>📝 Edit Admin: {admin.managerName}</h1>
          <p className="page-subtitle">
            {admin.email} • {admin.buildingCode} • {admin.managerCode}
          </p>
        </div>
      </div>

      <div className="edit-sections">
        {/* Admin Info Section */}
        <div className="edit-section">
          <h2>👤 Admin Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={admin.email}
                disabled
                className="input-disabled"
              />
              <small>ایمیل قابل تغییر نیست</small>
            </div>

            <div className="form-group">
              <label htmlFor="buildingCode">Building Code</label>
              <input
                id="buildingCode"
                type="text"
                value={admin.buildingCode}
                disabled
                className="input-disabled"
              />
              <small>کد ساختمان قابل تغییر نیست</small>
            </div>

            <div className="form-group">
              <label htmlFor="managerCode">Manager Code</label>
              <input
                id="managerCode"
                type="text"
                value={admin.managerCode}
                disabled
                className="input-disabled"
              />
              <small>کد مدیر قابل تغییر نیست</small>
            </div>

            <div className="form-group">
              <label htmlFor="managerName">Manager Name *</label>
              <input
                id="managerName"
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="John Smith"
              />
              <small>نام کامل مدیر ساختمان</small>
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
        </div>

        {/* Parking Assignment Section */}
        <div className="edit-section">
          <h2>🅿️ Parking Assignments</h2>
          <p className="section-description">
            Select parkings this admin can manage. Currently {selectedParkingIds.length} parking(s) selected.
          </p>

          {parkings.length === 0 ? (
            <div className="empty-state-small">
              <div className="empty-icon">🅿️</div>
              <p>No parkings found for building {admin.buildingCode}</p>
              <small>Create parkings first to assign them to this admin</small>
            </div>
          ) : (
            <div className="parking-grid">
              {parkings.map((parking) => {
                const isSelected = selectedParkingIds.includes(parking.id);
                return (
                  <label
                    key={parking.id}
                    className={`parking-card ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleParkingSelection(parking.id)}
                    />
                    <div className="parking-details">
                      <strong>{parking.parkingName || parking.parkingNo}</strong>
                      <span className="parking-number">#{parking.parkingNo}</span>
                      {parking.buildingName && (
                        <span className="parking-building">{parking.buildingName}</span>
                      )}
                    </div>
                    {isSelected && <span className="check-badge">✓</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="edit-actions">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '⏳ Saving...' : '✅ Save Changes'}
        </button>
        <button className="btn-secondary" onClick={onBack} disabled={saving}>
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}
