import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../config/socket';
import MetricCard from '../components/MetricCard';
import ForensicJobRow from '../components/ForensicJobRow';

const API_BASE = "http://localhost:5000/api";

export default function Dashboard() {
  const [queue, setQueue] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const navigate = useNavigate();

  // 1. WebSocket & Queue Initialization
  useEffect(() => {
    fetchQueue();
    
    if (socket.connected) setConnectionStatus('CONNECTED');
    socket.on('connect', () => setConnectionStatus('CONNECTED'));
    socket.on('disconnect', () => setConnectionStatus('DISCONNECTED'));
    
    // Listen for real-time forensics updates
    socket.on('verdict_update', (payload) => {
      if (selectedApp && selectedApp.applicationId === payload.applicationId) {
        inspectApplication(payload.applicationId);
        setIsProcessing(false);
      }
      fetchQueue(); 
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('verdict_update');
    };
  }, [selectedApp]);

  // 2. Fetch Live Application Queue
  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem('finguard_token');
      const res = await fetch(`${API_BASE}/admin/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setQueue(data.queue);
      } else if (res.status === 403) {
        navigate('/login'); // Kick out unauthorized users
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  };

  // 3. Fetch Deep Forensics for Selected App
  const inspectApplication = async (appId) => {
    try {
      const token = localStorage.getItem('finguard_token');
      const res = await fetch(`${API_BASE}/admin/applications/${appId}/forensics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSelectedApp(data.data);
        socket.emit('join_application_room', appId);
      }
    } catch (err) {
      console.error("Failed to fetch application details:", err);
    }
  };

  // 4. Trigger Python Worker Analysis
  const triggerAnalysis = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('finguard_token');
      await fetch(`${API_BASE}/documents/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId: selectedApp.applicationId })
      });
    } catch (err) {
      setIsProcessing(false);
      console.error("Failed to trigger analysis:", err);
    }
  };

  // 5. Submit Final Underwriting Verdict
  const submitVerdict = async (decision) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('finguard_token');
      const res = await fetch(`${API_BASE}/admin/verdict`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          applicationId: selectedApp.applicationId, 
          finalDecision: decision 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        await fetchQueue();
        await inspectApplication(selectedApp.applicationId);
      }
    } catch (err) {
      console.error("Failed to submit verdict:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      
      {/* LEFT PANEL: The Live Application Queue */}
      <div className="w-1/3 lg:w-1/4 bg-slate-900 border-r border-slate-800 flex flex-col h-screen z-10 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="font-black text-emerald-400 tracking-tight flex items-center gap-2">
            🛡️ FinGuard
          </h2>
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} title={connectionStatus}></div>
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white transition-colors">Logout</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4 px-2">Incoming Queue</span>
          {queue.length === 0 && <p className="text-slate-500 text-xs text-center mt-4 font-mono">No pending applications.</p>}
          
          {queue.map(app => (
            <div 
              key={app.id} 
              onClick={() => inspectApplication(app.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${selectedApp?.applicationId === app.id ? 'bg-slate-800 border-emerald-500 shadow-md' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-xs text-slate-200 font-bold">{app.id.substring(0, 14)}...</span>
                <span className={`text-[9px] font-black px-2 py-1 rounded tracking-wider uppercase ${app.overall_status === 'APPROVED' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' : app.overall_status === 'REJECTED' ? 'bg-rose-950/50 text-rose-400 border border-rose-900/50' : 'bg-amber-950/50 text-amber-400 border border-amber-900/50'}`}>
                  {app.overall_status}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 border-t border-slate-800 pt-2">
                <span>Amt: <span className="text-emerald-400 font-mono font-bold">${parseFloat(app.requested_amount).toLocaleString()}</span></span>
                <span>CIBIL: <span className="text-slate-300 font-mono">{app.cibil_score}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: The Workspace */}
      <div className="flex-1 bg-slate-950 h-screen overflow-y-auto p-8 relative">
        {selectedApp ? (
          <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-800 pb-6 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Ledger ID</span>
                <h1 className="text-3xl font-black text-slate-100 font-mono tracking-tight">{selectedApp.applicationId}</h1>
                <p className="text-xs text-slate-500 mt-2 font-mono">Ingested: {new Date(selectedApp.submittedAt).toLocaleString()}</p>
              </div>
              
              {(selectedApp.overallStatus === 'PENDING_DOCUMENTS' || selectedApp.overallStatus === 'PROCESSING') && (
                <button 
                  onClick={triggerAnalysis} 
                  disabled={isProcessing}
                  className={`px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 ${isProcessing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}
                >
                  {isProcessing ? (
                    <><span className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span> Matrix Audits Running...</>
                  ) : (
                    <>⚡ Execute Compliance Analysis</>
                  )}
                </button>
              )}
            </div>

            {/* Metrics Integration (Using your MetricCard component) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard 
                title="Composite Risk Score" 
                value={selectedApp.compositeCreditScore} 
                statusColor={selectedApp.overallRiskMatrix === 'RED' ? 'text-rose-500' : 'text-emerald-400'} 
              />
              <MetricCard 
                title="Verified Bureau CIBIL" 
                value={selectedApp.bureauCibilScore} 
                statusColor="text-slate-100" 
              />
              <MetricCard 
                title="Current Pipeline Status" 
                value={selectedApp.overallStatus} 
                statusColor={selectedApp.overallStatus === 'APPROVED' ? 'text-emerald-400' : selectedApp.overallStatus === 'REJECTED' ? 'text-rose-500' : 'text-amber-400'} 
              />
            </div>

            {/* Evidence Pool Integration (Using your ForensicJobRow component) */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-6">Verified Evidence Pool</h3>
              <div className="grid grid-cols-1 gap-6">
                {selectedApp.documentsAnalyzed?.map((doc) => (
                  <ForensicJobRow key={doc.jobId} doc={doc} />
                ))}
              </div>
            </div>

            {/* FINAL JUDGMENT CONTROLS */}
            {(selectedApp.overallStatus === 'UNDER_REVIEW' || selectedApp.overallStatus === 'PENDING_DOCUMENTS' || selectedApp.overallStatus === 'PROCESSING') && (
              <div className="mt-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-slate-800 to-rose-500"></div>
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider text-center mb-6">Execute Final Underwriting Policy</h3>
                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                  <button 
                    onClick={() => submitVerdict('APPROVED')} 
                    disabled={isProcessing}
                    className="flex-1 bg-emerald-600/10 border border-emerald-600/30 hover:bg-emerald-600 hover:text-white text-emerald-500 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✅ Authorize & Approve
                  </button>
                  <button 
                    onClick={() => submitVerdict('REJECTED')} 
                    disabled={isProcessing}
                    className="flex-1 bg-rose-600/10 border border-rose-600/30 hover:bg-rose-600 hover:text-white text-rose-500 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ❌ Reject Application
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-sm space-y-4">
            <span className="text-4xl">📂</span>
            <p>[ Select a ledger entry from the queue to mount the underwriter workspace ]</p>
          </div>
        )}
      </div>
    </div>
  );
}