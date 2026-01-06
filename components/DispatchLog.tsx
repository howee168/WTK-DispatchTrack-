import React, { useState } from 'react';
import { LogEntry } from '../types';
import { AlertTriangle, CheckCircle, Search, MapPin, ImageIcon, X } from 'lucide-react';

interface DispatchLogProps {
  logs: LogEntry[];
}

const DispatchLog: React.FC<DispatchLogProps> = ({ logs }) => {
  const [selectedProofImages, setSelectedProofImages] = useState<string[] | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
       <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Scan History</h1>
          <p className="text-slate-500 mt-1">Audit log of all worker actions, GPS stamps, and photo proof.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Time</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">User</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Action</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Job ID</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Proof</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice().reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      <div className="font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                      {log.scannedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.isMatch ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                          log.action === 'INSTALL' ? 'bg-green-50 text-green-700 border-green-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {log.action}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-bold border border-red-100">
                          <AlertTriangle className="w-3 h-3 mr-1" /> ERROR
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.proofImages && log.proofImages.length > 0 ? (
                        <button 
                          onClick={() => setSelectedProofImages(log.proofImages!)}
                          className="flex items-center gap-1 text-brand-600 hover:text-brand-800 font-medium group"
                        >
                          <ImageIcon className="w-4 h-4" /> 
                          <span>{log.proofImages.length} Photo{log.proofImages.length > 1 ? 's' : ''}</span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs font-mono">
                      {log.gpsLocation ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {log.gpsLocation}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Modal */}
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

export default DispatchLog;