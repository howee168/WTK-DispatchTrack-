export enum OrderStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  LOADED = 'LOADED',
  ARRIVED = 'ARRIVED',
  INSTALLED = 'INSTALLED',
  ERROR = 'ERROR'
}

export type ScanAction = 'PICKUP' | 'LOAD' | 'ARRIVE' | 'INSTALL';

export interface BoxItem {
  name: string;
  qty: number;
}

export interface Order {
  id: string;
  hospitalName: string; // Destination / Project Name
  status: OrderStatus;
  expectedTruckId: string;
  items: BoxItem[]; 
  lastAction?: ScanAction;
  lastScannedAt?: number;
  lastScannedBy?: string;
  proofImages?: string[]; // Changed to array for multiple photos
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