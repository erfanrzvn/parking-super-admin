// Types for Super Admin App
export interface Building {
  id: string;
  buildingCode: string;
  buildingName: string;
  buildingNo: string;
  address: string;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Admin {
  id: string;
  buildingCode: string;
  managerCode: string;
  managerName: string;
  phoneNo?: string | null;
  email: string;
  buildingName?: string | null;
  buildingNo?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitInfo {
  id: string;
  buildingCode: string;
  unitNo: string;
  accessNo: string;
  sakenName: string;
  sakenLastName?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Parking {
  id: string;
  buildingCode: string;
  buildingName?: string | null;
  buildingNo?: string | null;
  parkingName?: string | null;
  parkingNo: string;
  parkingLots?: number | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reserving {
  id: string;
  dateTime: string;
  parkingNo: string;
  vehicleCode?: string | null;
  accessNo: string;
  phone?: string | null;
  email?: string | null;
  duration?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
