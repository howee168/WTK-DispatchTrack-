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
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-A',
    items: [{ name: 'Medical Gas Alarm Panel', qty: 1 }, { name: 'Copper Pipes 15mm', qty: 20 }]
  },
  { 
    id: 'JOB-SJ-102', 
    hospitalName: 'Subang Jaya Med Center', 
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-B',
    items: [{ name: 'Surgical Light Kit', qty: 1 }]
  },
  { 
    id: 'JOB-KL-003', 
    hospitalName: 'General Hospital KL - Ward 4', 
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-A',
    items: [{ name: 'HVAC Filters', qty: 12 }, { name: 'Duct Tape', qty: 5 }]
  },
  { 
    id: 'JOB-PN-104', 
    hospitalName: 'Penang General', 
    status: OrderStatus.CREATED, 
    expectedTruckId: 'TRUCK-C',
    items: [{ name: 'Reception Desk Legs', qty: 4 }, { name: 'Table Top', qty: 1 }]
  },
];

export const MOCK_USER = "Ali (Driver)";