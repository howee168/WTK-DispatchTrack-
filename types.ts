export enum OrderStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  LOADED = 'LOADED',
  ERROR = 'ERROR'
}

export type ScanAction = 'PICKUP' | 'LOAD';

export interface BoxItem {
  name: string;
  qty: number;
  sku?: string;
  uom?: string; // Unit of Measure (Box, Pallet, Pcs)
  description?: string;
  batchNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
}

export interface Order {
  id: string;
  hospitalName: string; // Destination / Project Name
  address?: string; // Detailed delivery address
  priority?: 'Urgent' | 'Standard' | 'Low';
  status: OrderStatus;
  expectedTruckId: string; // Empty string if not assigned
  items: BoxItem[]; 
  lastAction?: ScanAction;
  lastScannedAt?: number;
  lastScannedBy?: string;
  proofImages?: string[]; // Array for multiple photos
  notes?: string;
}

export interface Truck {
  id: string;
  name: string;
  color: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  orderId: string;
  scannedBy: string;
  action: ScanAction;
  truckId?: string; // Only if action is LOAD
  gpsLocation?: string; // Lat,Lng string
  proofImages?: string[]; // Changed to array
  isMatch: boolean;
  notes?: string;
}

export type AppView = 'DASHBOARD' | 'SCANNER' | 'LOGS';