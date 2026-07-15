# Super Admin App - Residential Parking Management

این app برای **Super Administrators** است که مدیریت کامل همه Buildings را دارند.

## 🎯 Features

- ✅ مدیریت همه Buildings (ساختمان‌ها)
- ✅ ایجاد و ویرایش Buildings
- ✅ مدیریت Building Admins
- ✅ مشاهده همه Units در همه Buildings
- ✅ مدیریت همه Parkings
- ✅ گزارش‌های کامل
- ✅ دسترسی کامل به دیتابیس

## 🔐 Authorization

- **Group**: SuperAdmins
- **Access Level**: Full database access
- **Custom Attributes**: `custom:role = SuperAdmin`

## 🚀 Setup

### 1. Install Dependencies
```bash
cd "version 2/super_admin"
npm install
```

### 2. Copy Backend Configuration
بعد از deploy کردن shared backend:
```powershell
Copy-Item "..\shared\amplify_outputs.json" ".\src\"
```

### 3. Update main.tsx
Uncomment these lines in `src/main.tsx`:
```typescript
import outputs from './amplify_outputs.json';
Amplify.configure(outputs);
```

### 4. Run Development Server
```bash
npm run dev
```

App روی http://localhost:3001 اجرا میشه.

## 👤 First Super Admin User

بعد از deploy shared backend، اولین Super Admin رو باید manual بسازی:

### 1. Create User in Cognito
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username superadmin@example.com \
  --user-attributes Name=email,Value=superadmin@example.com Name=custom:role,Value=SuperAdmin \
  --temporary-password TempPass123! \
  --region ca-central-1
```

### 2. Add to SuperAdmins Group
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username superadmin@example.com \
  --group-name SuperAdmins \
  --region ca-central-1
```

### 3. First Login
- Login با email: superadmin@example.com
- Temporary password: TempPass123!
- بعد از اولین login، password جدید بساز

## 📊 Main Features

### Buildings Management
- **Create**: ساخت ساختمان جدید با کد یکتا
- **Edit**: ویرایش اطلاعات ساختمان
- **View**: مشاهده همه ساختمان‌ها
- **Stats**: آمار واحدها و پارکینگ‌ها

### Admins Management
- **Assign**: Assign کردن Building Admin به هر ساختمان
- **Remove**: حذف Building Admin
- **View**: لیست همه Admins

### Units Management
- **Create**: ایجاد واحد مسکونی جدید
- **Edit**: ویرایش اطلاعات ساکن
- **Access Code**: تولید Access Code برای مهمان‌ها

### Parkings Management
- **Assign**: Assign کردن پارکینگ به Unit
- **Unassign**: آزاد کردن پارکینگ
- **Type**: تعیین نوع (Resident/Guest)

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📱 Port

این app روی **port 3001** اجرا میشه تا با بقیه apps conflict نداشته باشه:
- Super Admin: 3001
- Admin: 3002
- Resident: 3003
- Guest: 3004

## 🛠️ Technology Stack

- **React 18** + TypeScript
- **Vite** - Build tool
- **AWS Amplify Gen 2** - Backend
- **Amplify UI React** - Authentication components
- **React Router** - Navigation (optional, for multi-page)

## 📝 Notes

- این app فقط برای Super Admins است
- همه database operations در اینجا available هستن
- با احتیاط استفاده کن - این app دسترسی کامل داره!
