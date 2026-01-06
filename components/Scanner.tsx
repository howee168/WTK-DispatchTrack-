import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, Truck, MapPin, Package, Hammer, ArrowRight, UploadCloud, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { Order, Truck as TruckType, ScanAction } from '../types';

interface ScannerProps {
  trucks: TruckType[];
  orders: Order[];
  onScan: (orderId: string, action: ScanAction, isMatch: boolean, truckId?: string, proofImages?: string[], gps?: string) => void;
}

type ScanState = 'IDLE' | 'ACTION_SELECT' | 'CHECKLIST' | 'TRUCK_SELECT' | 'PHOTO_PROOF' | 'SUCCESS' | 'ERROR';

const Scanner: React.FC<ScannerProps> = ({ trucks, orders, onScan }) => {
  const [scanState, setScanState] = useState<ScanState>('IDLE');
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [selectedAction, setSelectedAction] = useState<ScanAction | null>(null);
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  
  const [manualId, setManualId] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Reset logic
  useEffect(() => {
    if (scanState === 'SUCCESS' || scanState === 'ERROR') {
      const timer = setTimeout(() => {
        resetScanner();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  const resetScanner = () => {
    setScanState('IDLE');
    setScannedOrder(null);
    setSelectedAction(null);
    setSelectedTruckId('');
    setProofImages([]);
    setCheckedItems(new Set());
    setFeedbackMessage('');
    setManualId('');
  };

  // Step 1: Handle Initial Scan
  const handleScan = (code: string) => {
    const order = orders.find(o => o.id.trim().toUpperCase() === code.trim().toUpperCase());
    
    if (!order) {
      setScanState('ERROR');
      setFeedbackMessage(`Order "${code}" not found.`);
      return;
    }

    setScannedOrder(order);
    setScanState('ACTION_SELECT');
  };

  // Step 2: Handle Action Selection
  const handleActionSelect = (action: ScanAction) => {
    setSelectedAction(action);
    setScanState('CHECKLIST');
  };

  // Step 3: Handle Checklist Validation
  const handleChecklistComplete = () => {
    if (selectedAction === 'LOAD') {
      setScanState('TRUCK_SELECT');
    } else {
      setScanState('PHOTO_PROOF');
    }
  };

  const toggleItemCheck = (index: number) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCheckedItems(newSet);
  };

  // Step 4 (Optional): Handle Truck Selection & Validation
  const handleTruckSelect = (truckId: string) => {
    if (!scannedOrder) return;
    
    setSelectedTruckId(truckId);

    if (scannedOrder.expectedTruckId !== truckId) {
      setScanState('ERROR');
      const correctTruck = trucks.find(t => t.id === scannedOrder.expectedTruckId);
      setFeedbackMessage(`WRONG TRUCK! Goes to ${correctTruck?.name}`);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      // Log the error immediately
      onScan(scannedOrder.id, 'LOAD', false, truckId);
      return;
    }
    
    // Truck is correct -> Go to photo
    setScanState('PHOTO_PROOF');
  };

  // Step 5: Handle Photo Proof & Final Submission
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitFinalize = () => {
    if (!scannedOrder || !selectedAction) return;

    // Simulate GPS
    const mockGPS = "3.1390° N, 101.6869° E"; 

    onScan(
      scannedOrder.id, 
      selectedAction, 
      true, 
      selectedAction === 'LOAD' ? selectedTruckId : undefined,
      proofImages.length > 0 ? proofImages : undefined,
      mockGPS
    );

    setFeedbackMessage(`${selectedAction} Complete!`);
    setScanState('SUCCESS');
  };

  // --- Handlers for simulated input ---
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId) handleScan(manualId);
  };

  const handleFileUploadMockScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       setTimeout(() => {
          // Simulate scanning a random order
          const randomOrder = orders[Math.floor(Math.random() * orders.length)];
          if (randomOrder) handleScan(randomOrder.id);
       }, 500);
    }
  };

  // --- RENDERERS ---

  if (scanState === 'IDLE') {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-white p-6 items-center justify-center relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Worker Scanner</h2>
          <p className="opacity-60">Scan QR to update status</p>
        </div>
        
        <div className="relative w-64 h-64 border-2 border-white/30 rounded-3xl flex items-center justify-center overflow-hidden mb-8 bg-black/20">
          <div className="absolute inset-0 border-4 border-brand-500/50 rounded-3xl animate-pulse"></div>
          <Camera className="w-16 h-16 text-white/50" />
          <input 
             type="file" 
             accept="image/*" 
             capture="environment"
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             onChange={handleFileUploadMockScan}
          />
        </div>

        <form onSubmit={handleManualSubmit} className="w-full max-w-xs">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Manual Job ID"
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </form>
      </div>
    );
  }

  if (scanState === 'ACTION_SELECT' && scannedOrder) {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-6 animate-fade-in">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Job Details</p>
           <h2 className="text-xl font-bold text-slate-800">{scannedOrder.hospitalName}</h2>
           <p className="text-brand-600 font-mono text-sm">{scannedOrder.id}</p>
        </div>

        <h3 className="text-lg font-bold text-slate-700 mb-4">What are you doing?</h3>
        
        <div className="grid grid-cols-2 gap-4 flex-1 content-start">
          <ActionButton 
            icon={<Package />} 
            label="Picked Up" 
            sub="From Warehouse"
            onClick={() => handleActionSelect('PICKUP')} 
            color="bg-blue-500"
          />
          <ActionButton 
            icon={<Truck />} 
            label="Load Truck" 
            sub="Verify Vehicle"
            onClick={() => handleActionSelect('LOAD')} 
            color="bg-orange-500"
          />
          <ActionButton 
            icon={<MapPin />} 
            label="Arrived" 
            sub="At Site (GPS)"
            onClick={() => handleActionSelect('ARRIVE')} 
            color="bg-purple-500"
          />
          <ActionButton 
            icon={<Hammer />} 
            label="Installed" 
            sub="Job Complete"
            onClick={() => handleActionSelect('INSTALL')} 
            color="bg-green-600"
          />
        </div>
        
        <button onClick={resetScanner} className="mt-auto w-full py-4 text-slate-400 font-medium">Cancel</button>
      </div>
    );
  }

  if (scanState === 'CHECKLIST' && scannedOrder) {
    const allChecked = scannedOrder.items.length === checkedItems.size;

    return (
      <div className="flex flex-col h-full bg-slate-50 p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Check Items</h2>
        <p className="text-slate-500 mb-6">Verify all items are present before proceeding.</p>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {scannedOrder.items.map((item, index) => {
            const isChecked = checkedItems.has(index);
            return (
              <div 
                key={index}
                onClick={() => toggleItemCheck(index)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isChecked 
                    ? 'bg-green-50 border-green-200 shadow-sm' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <p className={`font-bold ${isChecked ? 'text-green-800' : 'text-slate-800'}`}>{item.name}</p>
                  <p className="text-xs text-slate-500">Qty: {item.qty}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isChecked 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-slate-300'
                }`}>
                  {isChecked && <CheckCircle className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={handleChecklistComplete}
          disabled={!allChecked}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
            allChecked ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {allChecked ? 'Confirm & Continue' : `Verify Items (${checkedItems.size}/${scannedOrder.items.length})`}
        </button>
      </div>
    );
  }

  if (scanState === 'TRUCK_SELECT') {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Select Truck</h2>
        <p className="text-slate-500 mb-6">Which truck is this going onto?</p>
        <div className="space-y-3">
          {trucks.map(truck => (
            <button
              key={truck.id}
              onClick={() => handleTruckSelect(truck.id)}
              className={`w-full p-4 rounded-xl text-left border transition-all shadow-sm flex items-center justify-between bg-white hover:bg-slate-50 border-slate-200`}
            >
              <span className="font-bold text-slate-700">{truck.name}</span>
              <Truck className="w-5 h-5 text-slate-400" />
            </button>
          ))}
        </div>
        <button onClick={() => setScanState('ACTION_SELECT')} className="mt-auto w-full py-4 text-slate-400 font-medium">Back</button>
      </div>
    );
  }

  if (scanState === 'PHOTO_PROOF') {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Photo Proof</h2>
        <p className="text-slate-500 mb-6">Take photos to prove {selectedAction?.toLowerCase().replace('_', ' ')} status.</p>
        
        <div className="flex-1 overflow-y-auto">
          {/* Photo Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {proofImages.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                <img src={img} alt="Proof" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-90 hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Add Photo Button */}
            <div className="relative aspect-square rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 flex flex-col items-center justify-center text-brand-600 active:scale-95 transition-transform">
              <Plus className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold">Add Photo</span>
              <input 
                 type="file" 
                 accept="image/*" 
                 capture="environment"
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 onChange={handlePhotoUpload}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={submitFinalize}
          disabled={proofImages.length === 0}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
            proofImages.length > 0 ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          Submit Update ({proofImages.length} Photos)
        </button>
      </div>
    );
  }

  // Success/Error States
  return (
    <div className={`flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in ${
      scanState === 'ERROR' ? 'bg-red-600' : 'bg-green-600'
    }`}>
      {scanState === 'SUCCESS' ? (
        <>
          <CheckCircle className="w-32 h-32 text-white mb-4 drop-shadow-lg" />
          <h2 className="text-4xl font-extrabold text-white mb-2">UPDATED</h2>
          <p className="text-white/90 text-lg">{feedbackMessage}</p>
        </>
      ) : (
        <>
          <XCircle className="w-32 h-32 text-white mb-4 drop-shadow-lg" />
          <h2 className="text-4xl font-extrabold text-white mb-2">ERROR</h2>
          <p className="text-white/90 text-lg bg-black/20 p-4 rounded-xl">{feedbackMessage}</p>
        </>
      )}
    </div>
  );
};

// Helper Component for Buttons
const ActionButton = ({ icon, label, sub, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`${color} text-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center h-32 active:scale-95 transition-transform`}
  >
    <div className="mb-2 p-2 bg-white/20 rounded-full">{icon}</div>
    <span className="font-bold leading-tight">{label}</span>
    <span className="text-[10px] opacity-80 mt-1">{sub}</span>
  </button>
);

export default Scanner;