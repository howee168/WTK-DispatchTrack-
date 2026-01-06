import { Order, OrderStatus, Truck } from './types';

export const INITIAL_TRUCKS: Truck[] = [
  { id: 'TRUCK-A', name: 'Truck A (North)', color: 'bg-blue-100 text-blue-800' },
  { id: 'TRUCK-B', name: 'Truck B (South)', color: 'bg-green-100 text-green-800' },
  { id: 'TRUCK-C', name: 'Truck C (City)', color: 'bg-purple-100 text-purple-800' },
  { id: 'TRUCK-D', name: 'Express Van', color: 'bg-orange-100 text-orange-800' },
];

export const INITIAL_ORDERS: Order[] = [
  { 
    id: 'JOB-KL-001', 
    hospitalName: 'General Hospital KL - OT Room 3', 
    address: 'Jalan Pahang, 50586 Kuala Lumpur, Wilayah Persekutuan',
    priority: 'Urgent',
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-A',
    notes: 'Fragile items. Handle with care.',
    items: [
      { 
        name: 'Medical Gas Alarm Panel', 
        qty: 1, 
        sku: 'MG-ALM-001', 
        uom: 'Unit', 
        description: 'Zone 3 Area Alarm', 
        batchNumber: 'B-2023-99', 
        expiryDate: 'N/A' 
      }, 
      { 
        name: 'Copper Pipes 15mm', 
        qty: 20, 
        sku: 'CP-15MM-X', 
        uom: 'Length', 
        description: 'Medical Grade Copper Type L', 
        batchNumber: 'CP-99281' 
      }
    ]
  },
  { 
    id: 'JOB-SJ-102', 
    hospitalName: 'Subang Jaya Med Center', 
    address: '1, Jalan SS 12/1A, 47500 Subang Jaya, Selangor',
    priority: 'Standard',
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-B',
    items: [
      { 
        name: 'Surgical Light Kit', 
        qty: 1, 
        sku: 'SL-KIT-LED', 
        uom: 'Set', 
        description: 'Dual Head LED Surgical Light', 
        serialNumber: 'SN: 9982-1120-AA',
        expiryDate: '2030-12-31'
      }
    ]
  },
  { 
    id: 'JOB-KL-003', 
    hospitalName: 'General Hospital KL - Ward 4', 
    address: 'Jalan Pahang, 50586 Kuala Lumpur, Wilayah Persekutuan',
    priority: 'Standard',
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-A',
    items: [
      { name: 'HVAC Filters', qty: 12, sku: 'FIL-HEPA-04', uom: 'Box', description: 'HEPA Filters 24x24' }, 
      { name: 'Duct Tape', qty: 5, sku: 'MSC-TAPE', uom: 'Roll' }
    ]
  },
  { 
    id: 'JOB-PN-104', 
    hospitalName: 'Penang General', 
    address: 'Jalan Residensi, 10990 George Town, Pulau Pinang',
    priority: 'Low',
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-C',
    items: [
      { name: 'Reception Desk Legs', qty: 4, sku: 'FUR-DSK-LG', uom: 'Pcs' }, 
      { name: 'Table Top', qty: 1, sku: 'FUR-DSK-TP', uom: 'Unit' }
    ]
  },
];

export const MOCK_USER = "Ali (Driver)";