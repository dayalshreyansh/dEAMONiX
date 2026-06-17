import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedApp, setSelectedApp] = useState(null);
  const [forensics, setForensics] = useState(null);
  const [loadingForensics, setLoadingForensics] = useState(false);

  // --- LOGIC ---
  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/admin/queue');
      setQueue(res.data.queue || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
      setLoading(false);
    }
  };

  const handleViewForensics = async (applicationId) => {
    setSelectedApp(applicationId);
    setLoadingForensics(true);
    try {
      const res = await api.get(`/admin/applications/${applicationId}/forensics`);
      setForensics(res.data.data); 
    } catch (error) {
      console.error("Failed to load forensics:", error);
    } finally {
      setLoadingForensics(false);
    }
  };

  const handleVerdict = async (verdict) => {
    try {
      await api.post('/admin/verdict', {
        applicationId: selectedApp,
        finalDecision: verdict 
      });
      
      setSelectedApp(null);
      setForensics(null);
      fetchQueue();
    } catch (error) {
      console.error("Failed to submit verdict:", error);
      alert("Error submitting verdict.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('finguard_token');
    localStorage.removeItem('finguard_role');
    navigate('/login');
  };

  const getRiskColor = (risk) => {
    if (risk === 'GREEN') return 'bg-green-900/40 text-green-400 border-green-800';
    if (risk === 'YELLOW') return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
    if (risk === 'RED') return 'bg-red-900/40 text-red-400 border-red-800';
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden font-sans text-gray-200">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex justify-between items-center shadow-md flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow">
            FG
          </div>
          <span className="text-xl font-extrabold text-white tracking-wide">Command Center</span>
          <span className="ml-4 px-2 py-1 bg-gray-800 text-xs font-mono text-gray-400 rounded border border-gray-700">ADMINISTRATOR</span>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm font-semibold text-gray-400 hover:text-white transition"
        >
          Secure Logout
        </button>
      </nav>

      {/* --- SPLIT PANE LAYOUT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANE: The Queue List */}
        <div className="w-1/3 max-w-md bg-gray-900 border-r border-gray-800 flex flex-col h-full shadow-lg z-0">
          <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-bold text-gray-300 uppercase tracking-wider text-sm">Live Queue</h2>
            <span className="bg-blue-900/50 text-blue-400 border border-blue-800 text-xs font-bold px-2 py-1 rounded-full">{queue.length} Active</span>
          </div>
          
          <div className="overflow-y-auto flex-1 p-3 space-y-3 bg-gray-950">
            {queue.length === 0 && (
              <p className="text-center text-gray-500 py-10 text-sm">No applications pending review.</p>
            )}
            
            {queue.map((app) => (
              <div 
                key={app.id} 
                onClick={() => handleViewForensics(app.id)}
                className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                  selectedApp === app.id 
                    ? 'bg-gray-800 border-blue-500 shadow-lg shadow-blue-900/20 transform scale-[1.02]' 
                    : 'bg-gray-900 border-gray-800 hover:border-gray-600 hover:bg-gray-800/80'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs text-gray-400 truncate w-32" title={app.id}>{app.id.split('_')[1] || app.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(app.overall_risk_matrix)}`}>
                    {app.overall_risk_matrix || 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-gray-500 font-semibold uppercase">Requested</div>
                    <div className="text-lg font-extrabold text-white">₹{app.requested_amount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${app.overall_status === 'APPROVED' ? 'text-green-400' : app.overall_status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {app.overall_status?.replace('_', ' ') || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANE: The Forensic Dossier */}
        <div className="flex-1 bg-gray-950 overflow-y-auto relative">
          {!selectedApp ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <svg className="w-24 h-24 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h2 className="text-2xl font-bold text-gray-400">No Dossier Selected</h2>
              <p className="text-sm mt-2">Select an application from the queue to review AI forensics.</p>
            </div>
          ) : loadingForensics ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-blue-400 animate-pulse">Extracting secure AI logs...</p>
            </div>
          ) : forensics ? (
            <div className="p-10 max-w-5xl mx-auto">
              
              {/* Dossier Header */}
              <div className="mb-8 border-b border-gray-800 pb-6">
                <h2 className="text-3xl font-extrabold text-white">Forensic Profile</h2>
                <p className="text-gray-500 font-mono mt-1 text-sm">Target: {selectedApp}</p>
              </div>

              {/* KPI Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm flex flex-col justify-center items-center">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Bureau CIBIL</p>
                  <p className="text-4xl font-black text-white">{forensics.bureauCibilScore || 'N/A'}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm flex flex-col justify-center items-center">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Composite Score</p>
                  <p className="text-4xl font-black text-blue-400">{forensics.compositeCreditScore || 'PENDING'}</p>
                </div>
                <div className={`p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center ${
                  forensics.overallRiskMatrix === 'GREEN' ? 'bg-green-900/20 border-green-800' : 
                  forensics.overallRiskMatrix === 'RED' ? 'bg-red-900/20 border-red-800' : 'bg-yellow-900/20 border-yellow-800'
                }`}>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">AI Risk Matrix</p>
                  <p className={`text-3xl font-black ${
                    forensics.overallRiskMatrix === 'GREEN' ? 'text-green-400' : 
                    forensics.overallRiskMatrix === 'RED' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {forensics.overallRiskMatrix || 'ANALYZING'}
                  </p>
                </div>
              </div>

              {/* Document Breakdown */}
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Asset Analysis Logs
              </h3>
              
              <div className="space-y-6">
                {forensics.documentsAnalyzed?.map((doc, idx) => (
                  <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                      <span className="font-mono text-sm font-bold text-gray-300">
                        File: {doc.storagePath?.split('/').pop() || 'Processing...'}
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 bg-blue-900/30 border border-blue-800 px-3 py-1 rounded-full">
                        {doc.inferredType ? doc.inferredType.replace('_', ' ') : 'AWAITING TYPE'}
                      </span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Math/Structure Status</p>
                          <p className={`text-lg font-bold ${doc.complianceMathStatus === 'GREEN' ? 'text-green-400' : doc.complianceMathStatus === 'RED' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {doc.complianceMathStatus || 'PENDING'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Visual Tamper Score</p>
                          <div className="flex items-center mt-1">
                            <span className="text-2xl font-black text-white mr-2">{doc.visualTamperScore || 0}%</span>
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${doc.visualTamperScore > 30 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${Math.min(doc.visualTamperScore || 0, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 bg-black/50 border border-gray-800 rounded-lg p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Worker Log Output</p>
                        <p className={`font-mono text-sm leading-relaxed ${doc.auditLog?.includes('🚨') ? 'text-red-400' : 'text-green-400'}`}>
                          {'>'} {doc.auditLog || "Awaiting execution matrix... Node still analyzing document."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!forensics.documentsAnalyzed || forensics.documentsAnalyzed.length === 0) && (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                    Documents are currently queued for AI processing. Check back momentarily.
                  </div>
                )}
              </div>

              {/* Final Decision Engine - ONLY HIDES IF APPROVED OR REJECTED */}
              {(forensics.overallStatus !== 'APPROVED' && forensics.overallStatus !== 'REJECTED') && (
                <div className="mt-12 bg-gray-900 p-8 rounded-2xl border-2 border-dashed border-gray-700 text-center shadow-sm">
                  <h3 className="text-2xl font-extrabold text-white mb-2">Final Human Verdict</h3>
                  <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Please authorize the final decision based on the forensic logs above.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <button 
                      onClick={() => handleVerdict('REJECTED')} 
                      className="px-10 py-4 font-black rounded-xl shadow-lg transition transform hover:-translate-y-1 w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
                    >
                      REJECT LOAN
                    </button>
                    <button 
                      onClick={() => handleVerdict('APPROVED')} 
                      className="px-10 py-4 font-black rounded-xl shadow-lg transition transform hover:-translate-y-1 w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white shadow-green-900/20"
                    >
                      APPROVE LOAN
                    </button>
                  </div>
                </div>
              )}

              {/* Status Banner if already decided */}
              {(forensics.overallStatus === 'APPROVED' || forensics.overallStatus === 'REJECTED') && (
                <div className={`mt-10 p-6 rounded-xl border-2 text-center ${
                  forensics.overallStatus === 'APPROVED' ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'
                }`}>
                  <h3 className="text-xl font-bold uppercase tracking-widest">
                    Decision Locked: {forensics.overallStatus}
                  </h3>
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}