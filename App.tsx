import React, { useState } from 'react';
import { INITIAL_ORDERS, INITIAL_TRUCKS, MOCK_USER } from './constants';
import { Order, LogEntry, AppView, OrderStatus, ScanAction } from './types';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import DispatchLog from './components/DispatchLog';
import { LayoutDashboard, ScanLine, ClipboardList } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Function to handle a new scan event
  const handleScan = (
    orderId: string, 
    action: ScanAction,
    isMatch: boolean,
    truckId?: string,
    proofImages?: string[],
    gps?: string
  ) => {
    
    const timestamp = Date.now();

    // 1. Create Log Entry
    const newLog: LogEntry = {
      id: timestamp.toString(),
      timestamp,
      orderId,
      scannedBy: MOCK_USER,
      action,
      truckId,
      gpsLocation: gps,
      proofImages,
      isMatch
    };
    setLogs(prev => [newLog, ...prev]);

    // 2. Update Order Status if it was a success
    if (isMatch) {
      let newStatus = OrderStatus.CREATED;
      switch (action) {
        case 'PICKUP': newStatus = OrderStatus.PICKED_UP; break;
        case 'LOAD': newStatus = OrderStatus.LOADED; break;
      }

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { 
          ...o, 
          status: newStatus,
          lastAction: action,
          lastScannedAt: timestamp,
          lastScannedBy: MOCK_USER,
          proofImages: proofImages
        } : o
      ));
    }
  };

  // Function to add a manual order
  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  // Function to delete an order
  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm(`Are you sure you want to delete order ${orderId}? This cannot be undone.`)) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const renderView = () => {
    switch(view) {
      case 'SCANNER':
        return <Scanner trucks={INITIAL_TRUCKS} orders={orders} onScan={handleScan} />;
      case 'LOGS':
        return <DispatchLog logs={logs} />;
      default:
        return <Dashboard 
          orders={orders} 
          trucks={INITIAL_TRUCKS} 
          onAddOrder={handleAddOrder}
          onDeleteOrder={handleDeleteOrder}
        />;
    }
  };

  return (
    // h-[100dvh] ensures it fits mobile screens even with address bars
    <div className="h-[100dvh] bg-slate-50 font-sans text-slate-900 flex flex-col pt-safe">
      
      {/* View Content (Scrollable) */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 w-full pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
          <NavButton 
            active={view === 'DASHBOARD'} 
            onClick={() => setView('DASHBOARD')} 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
          />
          
          <div className="relative -top-6">
            <button
              onClick={() => setView('SCANNER')}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition active:scale-95 ${
                view === 'SCANNER' 
                  ? 'bg-slate-900 text-white ring-4 ring-slate-100' 
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              <ScanLine className="w-8 h-8" />
            </button>
          </div>

          <NavButton 
            active={view === 'LOGS'} 
            onClick={() => setView('LOGS')} 
            icon={<ClipboardList />} 
            label="History" 
          />
        </div>
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  special?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, special }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-full transition ${
        active 
          ? special ? 'text-purple-600' : 'text-brand-600' 
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
        className: `w-6 h-6 mb-1 ${active ? 'fill-current opacity-20' : ''}` 
      }) : icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
};

export default App;