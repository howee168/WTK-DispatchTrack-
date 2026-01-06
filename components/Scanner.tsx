import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, Truck, Package, Plus, Trash2, Flashlight, RefreshCcw, X, MapPin, User, Calendar, Box, AlertTriangle, FileText, Barcode, CalendarDays, Hash, Info, MapPinned, AlertCircle } from 'lucide-react';
import { Order, Truck as TruckType, ScanAction } from '../types';
// @ts-ignore
import jsQR from 'jsqr';

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
  
  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const animationRef = useRef<number>(0);

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

  // Reset logic
  useEffect(() => {
    if (scanState === 'SUCCESS' || scanState === 'ERROR') {
      const timer = setTimeout(() => {
        resetScanner();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  // Start Camera when entering IDLE state
  useEffect(() => {
    if (scanState === 'IDLE') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanState]);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Required for iOS to play video inline
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Attempt to scan QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleScan(code.data);
            return; // Stop ticking if found
          }
        }
      }
    }
    animationRef.current = requestAnimationFrame(tick);
  };

  // Step 1: Handle Initial Scan
  const handleScan = (code: string) => {
    stopCamera();
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

  // --- RENDERERS ---

  if (scanState === 'IDLE') {
    return (
      <div className="flex flex-col h-full bg-black relative overflow-hidden">
        {/* Live Camera Feed */}
        <div className="absolute inset-0 z-0">
          {!cameraError ? (
            <>
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                muted 
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-900">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p>Camera access denied or unavailable.</p>
              <p className="text-xs mt-2">Please use manual entry below.</p>
            </div>
          )}
        </div>

        {/* Scan Overlay (UI only) */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
           <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-xl -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-xl -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-xl -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-xl -mb-1 -mr-1"></div>
              <div className="absolute inset-0 bg-brand-500/10 animate-pulse rounded-3xl"></div>
           </div>
           <p className="text-white font-bold mt-8 bg-black/40 px-4 py-1 rounded-full backdrop-blur-md">
             Align QR Code in frame
           </p>
        </div>

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start">
           <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
             <span className="text-white text-xs font-bold flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               LIVE SCANNER
             </span>
           </div>
        </div>

        {/* Bottom Manual Entry Sheet */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-6 px-6">
          <form onSubmit={handleManualSubmit} className="w-full max-w-sm mx-auto">
            <label className="text-xs font-bold text-slate-300 uppercase ml-1 mb-2 block">Or Enter Manually</label>
            <div className="relative">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Type Job ID (e.g. JOB-KL-001)"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-4 text-center focus:ring-2 focus:ring-brand-500 outline-none backdrop-blur-md"
              />
              <button 
                type="submit" 
                disabled={!manualId}
                className="absolute right-2 top-2 bottom-2 bg-brand-600 text-white px-4 rounded-lg font-bold disabled:opacity-0 transition-opacity"
              >
                GO
              </button>
            </div>
            {/* Quick Mock Button for Testing without QR */}
            <div className="mt-4 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
               <button 
                type="button" 
                onClick={() => {
                   const random = orders[Math.floor(Math.random() * orders.length)];
                   if (random) handleScan(random.id);
                }}
                className="text-[10px] text-white underline"
               >
                 Simulate Scan
               </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (scanState === 'ACTION_SELECT' && scannedOrder) {
    const truck = trucks.find(t => t.id === scannedOrder.expectedTruckId);

    return (
      <div className="flex flex-col h-full bg-slate-50 relative animate-fade-in">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm z-10">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Scan Successful
          </h2>
          <button onClick={resetScanner} className="p-2 -mr-2 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 pb-36">
          
          {/* Status Banner */}
          <div className={`px-6 py-4 flex justify-between items-center ${
             scannedOrder.status === 'LOADED' ? 'bg-orange-100 border-b border-orange-200' :
             scannedOrder.status === 'PICKED_UP' ? 'bg-blue-100 border-b border-blue-200' :
             'bg-slate-100 border-b border-slate-200'
          }`}>
             <div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">Status</span>
                <div className={`text-lg font-black ${
                    scannedOrder.status === 'LOADED' ? 'text-orange-800' :
                    scannedOrder.status === 'PICKED_UP' ? 'text-blue-800' :
                    'text-slate-600'
                }`}>
                {scannedOrder.status.replace('_', ' ')}
                </div>
             </div>
             <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">Last Scan</span>
                <div className="text-sm font-medium text-slate-700">
                  {scannedOrder.lastScannedBy || 'N/A'}
                </div>
             </div>
          </div>

          <div className="p-4 space-y-4">
            
            {/* 1. Job & Customer Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-500">Order & Job Info</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        scannedOrder.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-100' : 
                        scannedOrder.priority === 'Low' ? 'bg-green-50 text-green-700 border-green-100' : 
                        'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                        {scannedOrder.priority || 'Standard'}
                    </span>
                </div>
                <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500">Job ID</p>
                            <p className="font-mono font-bold text-slate-800">{scannedOrder.id}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                        <MapPinned className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500">Customer & Destination</p>
                            <p className="font-bold text-slate-900 leading-tight">{scannedOrder.hospitalName}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-snug">{scannedOrder.address || 'Address not specified'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Truck / Route Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase text-slate-500">Logistics</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Assigned Vehicle</p>
                        {truck ? (
                            <div>
                                <p className="font-bold text-slate-800 text-lg">{truck.name}</p>
                                <p className="text-xs text-slate-400 font-mono">{scannedOrder.expectedTruckId}</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-orange-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-bold">Not Assigned</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-full ${truck?.color.split(' ')[0] || 'bg-slate-100'}`}>
                        <Truck className={`w-6 h-6 ${truck?.color.split(' ')[1] || 'text-slate-400'}`} />
                    </div>
                </div>
            </div>

            {/* 3. Packing List (Product Identification) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-500">Packing List</span>
                    <span className="text-xs font-bold text-slate-400">{scannedOrder.items.length} Items</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {scannedOrder.items.map((item, idx) => (
                        <div key={idx} className="p-4">
                            {/* Product Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                                    <p className="text-xs text-slate-500">{item.description || 'No description'}</p>
                                </div>
                                <div className="text-right">
                                     <span className="block text-lg font-black text-slate-800">{item.qty}</span>
                                     <span className="text-[10px] text-slate-500 uppercase">{item.uom || 'Unit'}</span>
                                </div>
                            </div>
                            
                            {/* Detailed Attributes Grid */}
                            <div className="grid grid-cols-2 gap-2 mt-3 bg-slate-50 p-2 rounded-lg">
                                <div>
                                    <span className="flex items-center gap-1 text-[10px] uppercase text-slate-400 font-bold mb-0.5">
                                        <Barcode className="w-3 h-3" /> SKU / Code
                                    </span>
                                    <span className="text-xs font-mono text-slate-700">{item.sku || '-'}</span>
                                </div>
                                <div>
                                    <span className="flex items-center gap-1 text-[10px] uppercase text-slate-400 font-bold mb-0.5">
                                        <Hash className="w-3 h-3" /> Batch / Lot
                                    </span>
                                    <span className="text-xs font-mono text-slate-700">{item.batchNumber || '-'}</span>
                                </div>
                                <div>
                                    <span className="flex items-center gap-1 text-[10px] uppercase text-slate-400 font-bold mb-0.5">
                                        <CalendarDays className="w-3 h-3" /> Expiry
                                    </span>
                                    <span className="text-xs text-slate-700">{item.expiryDate || '-'}</span>
                                </div>
                                <div>
                                    <span className="flex items-center gap-1 text-[10px] uppercase text-slate-400 font-bold mb-0.5">
                                        <Info className="w-3 h-3" /> Serial
                                    </span>
                                    <span className="text-xs font-mono text-slate-700">{item.serialNumber || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Proof & Notes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase text-slate-500">Proof & Notes</span>
                </div>
                <div className="p-4">
                    {scannedOrder.notes && (
                        <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            <p className="text-xs font-bold text-yellow-800 mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Note:
                            </p>
                            <p className="text-sm text-yellow-900">{scannedOrder.notes}</p>
                        </div>
                    )}
                    
                    <p className="text-xs font-bold text-slate-400 mb-2">Previous Photos</p>
                    {scannedOrder.proofImages && scannedOrder.proofImages.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {scannedOrder.proofImages.map((img, i) => (
                                <img key={i} src={img} className="w-16 h-16 object-cover rounded-lg border border-slate-200" alt="proof" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No photos attached yet.</p>
                    )}
                </div>
            </div>

          </div>
        </div>
        
        {/* Bottom Actions - Fixed */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 flex gap-3">
           <button 
             onClick={() => handleActionSelect('PICKUP')}
             className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
           >
             <Package className="w-6 h-6" />
             <span>PICK UP</span>
           </button>
           <button 
             onClick={() => handleActionSelect('LOAD')}
             className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-brand-500/30 active:scale-95 transition-transform"
           >
             <Truck className="w-6 h-6" />
             <span>LOAD TRUCK</span>
           </button>
        </div>
      </div>
    );
  }

  if (scanState === 'CHECKLIST' && scannedOrder) {
    const allChecked = scannedOrder.items.length === checkedItems.size;

    return (
      <div className="flex flex-col h-full bg-slate-50 relative animate-fade-in">
        <div className="flex-1 overflow-y-auto p-6 pb-28">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Check Items</h2>
          <p className="text-slate-500 mb-6">Verify all items are present before proceeding.</p>

          <div className="space-y-3">
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
                    <p className="text-xs text-slate-500">Qty: {item.qty} {item.uom}</p>
                    {item.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>}
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
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
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
      </div>
    );
  }

  if (scanState === 'TRUCK_SELECT') {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative animate-fade-in">
        <div className="flex-1 overflow-y-auto p-6 pb-28">
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
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
           <button onClick={() => setScanState('ACTION_SELECT')} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition">Back to Action</button>
        </div>
      </div>
    );
  }

  if (scanState === 'PHOTO_PROOF') {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative animate-fade-in">
        <div className="flex-1 overflow-y-auto p-6 pb-28">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Photo Proof</h2>
          <p className="text-slate-500 mb-6">Take photos to prove {selectedAction?.toLowerCase().replace('_', ' ')} status.</p>
          
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

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
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

export default Scanner;