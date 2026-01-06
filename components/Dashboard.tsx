import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Truck, BoxItem } from '../types';
import { Printer, CheckCircle, Clock, Plus, X, MapPin, Truck as TruckIcon, Trash2, Package, Eye, Hammer, QrCode } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  trucks: Truck[];
  onAddOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, trucks, onAddOrder, onDeleteOrder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProofImages, setSelectedProofImages] = useState<string[] | null>(null);
  
  // Form State
  const [hospitalName, setHospitalName] = useState('');
  const [expectedTruckId, setExpectedTruckId] = useState('');
  const [items, setItems] = useState<BoxItem[]>([{ name: '', qty: 1 }]);

  // Set default truck when modal opens
  useEffect(() => {
    if (isModalOpen && !expectedTruckId && trucks.length > 0) {
      setExpectedTruckId(trucks[0].id);
    }
  }, [isModalOpen, trucks]);

  const handleAddItem = () => {
    setItems([...items, { name: '', qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BoxItem, value: string | number) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName || !expectedTruckId || items.every(i => !i.name.trim())) return;

    const validItems = items.filter(i => i.name.trim() !== '');
    const randomId = `JOB-${Math.floor(1000 + Math.random() * 9000)}`;

    const order: Order = {
      id: randomId,
      hospitalName: hospitalName,
      expectedTruckId: expectedTruckId,
      status: OrderStatus.CREATED,
      items: validItems
    };

    onAddOrder(order);
    setIsModalOpen(false);
    
    // Reset form
    setHospitalName('');
    setItems([{ name: '', qty: 1 }]);
    setExpectedTruckId(trucks[0]?.id || '');
  };

  const handlePrint = (order: Order) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${order.id}`;
    const truckName = trucks.find(t => t.id === order.expectedTruckId)?.name || 'Unassigned';
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Job Sheet - ${order.id}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; border: 4px solid #000; margin: 10px; }
              h1 { font-size: 20px; margin-bottom: 5px; }
              h2 { font-size: 28px; font-weight: 900; margin: 10px 0; }
              .box-info { margin: 20px 0; border: 2px solid #000; padding: 15px; text-align: left; }
              .items { text-align: left; font-size: 14px; margin-top: 20px; }
              img { margin: 10px auto; display: block; border: 1px solid #eee; }
              .footer { font-size: 12px; margin-top: 40px; font-weight: bold;}
            </style>
          </head>
          <body>
            <h1>DISPATCH TRACKER</h1>
            <h2>${truckName}</h2>
            <img src="${qrUrl}" width="200" height="200" />
            <div class="box-info">
              <p><strong>JOB ID:</strong> ${order.id}</p>
              <p><strong>DESTINATION:</strong><br/>${order.hospitalName}</p>
            </div>
            <div class="items">
              <strong>CONTENTS:</strong>
              <ul>
                ${order.items.map(item => `<li>${item.qty} x ${item.name}</li>`).join('')}
              </ul>
            </div>
            <div class="footer">SCAN AT EVERY STEP: WAREHOUSE > TRUCK > SITE > INSTALL</div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.INSTALLED:
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Hammer className="w-3 h-3"/> INSTALLED</span>;
      case OrderStatus.ARRIVED:
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> ON SITE</span>;
      case OrderStatus.LOADED:
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><TruckIcon className="w-3 h-3"/> IN TRANSIT</span>;
      case OrderStatus.PICKED_UP:
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Package className="w-3 h-3"/> WAREHOUSE</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> CREATED</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Live Status Board</h1>
          <p className="text-slate-500 mt-1">Real-time tracking of all active job orders.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition active:scale-95 shadow-lg shadow-brand-500/30"
        >
          <Plus className="w-5 h-5" />
          Create Job Order
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => {
          const truck = trucks.find(t => t.id === order.expectedTruckId);
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.id}`;

          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition hover:shadow-lg relative group">
              
              {/* Delete Button (Visible on Hover/Always on Mobile) */}
              <button 
                onClick={() => onDeleteOrder(order.id)}
                className="absolute top-4 right-4 z-10 text-slate-300 hover:text-red-500 transition-colors p-2 bg-white/80 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete Order"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-2 pr-8">
                  {getStatusBadge(order.status)}
                  <span className="font-mono text-xs text-slate-400 font-bold">{order.id}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight pr-4">{order.hospitalName}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <TruckIcon className="w-4 h-4" />
                  <span>{truck?.name || order.expectedTruckId}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex gap-4 mb-4">
                  {/* QR Code Preview */}
                  <div className="flex-shrink-0 w-24 h-24 bg-white border border-slate-100 rounded-lg p-1 flex items-center justify-center shadow-sm">
                    <img src={qrUrl} alt="QR" className="w-full h-full mix-blend-multiply" />
                  </div>
                  
                  {/* Proof Image Preview */}
                  <div className="flex-1">
                    {order.proofImages && order.proofImages.length > 0 ? (
                      <div 
                        className="w-full h-24 rounded-lg overflow-hidden border border-slate-200 relative group cursor-pointer"
                        onClick={() => setSelectedProofImages(order.proofImages!)}
                      >
                        <img src={order.proofImages[0]} alt="Proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold flex items-center gap-1"><Eye className="w-4 h-4"/> View</span>
                        </div>
                        {order.proofImages.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            +{order.proofImages.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-dashed border-slate-200 text-slate-300">
                        <span className="text-[10px] font-bold">NO PROOF</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Contents</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex justify-between border-b border-slate-50 pb-1 last:border-0">
                        <span>{item.name}</span>
                        <span className="font-mono text-slate-400">x{item.qty}</span>
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li className="text-xs text-slate-400 italic">+{order.items.length - 3} more items...</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                 <div className="text-xs text-slate-500">
                    {order.lastScannedBy ? (
                      <p>Last: <span className="font-bold text-slate-700">{order.lastScannedBy}</span></p>
                    ) : (
                      <p>Not scanned yet</p>
                    )}
                 </div>
                 <button 
                   onClick={() => handlePrint(order)}
                   className="flex items-center gap-1 text-brand-600 hover:text-brand-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold"
                 >
                   <Printer className="w-3 h-3" /> Print Label
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">New Job Order</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Project / Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 z-10" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. General Hospital KL - OT Room 3"
                      className="w-full pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none placeholder-slate-400"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Assign Truck</label>
                  <div className="relative">
                    <TruckIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 z-10" />
                    <select 
                      required
                      className="w-full pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer"
                      value={expectedTruckId}
                      onChange={(e) => setExpectedTruckId(e.target.value)}
                    >
                      {trucks.map(truck => (
                        <option key={truck.id} value={truck.id}>
                          {truck.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Items List</label>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-brand-600 text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto border border-slate-100">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="number" 
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        className="w-16 px-2 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-center outline-none"
                        placeholder="#"
                      />
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none"
                        placeholder="Item name"
                      />
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-500 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-600 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Gallery Modal */}
      {selectedProofImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedProofImages(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
             <button 
              onClick={() => setSelectedProofImages(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="flex overflow-x-auto gap-4 p-4 snap-x">
              {selectedProofImages.map((img, idx) => (
                <img key={idx} src={img} alt={`Proof ${idx + 1}`} className="h-[80vh] w-auto object-contain rounded-lg snap-center bg-black" />
              ))}
            </div>
            <p className="text-center text-white mt-4 font-bold">
              {selectedProofImages.length} Photo{selectedProofImages.length > 1 ? 's' : ''} Attached
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;