import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { socket } from '../config/socket';

export default function ClientPortal() {
  const navigate = useNavigate();
  
  // --- UI NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' | 'history'

  // --- APPLICATION FORM STATE ---
  const [formData, setFormData] = useState({ amount: 500000, cibil: 750 });
  const [files, setFiles] = useState({ aadhaar: null, pan: null, salary: null });
  const [status, setStatus] = useState('idle');
  const [finalVerdict, setFinalVerdict] = useState(null);

  // --- HISTORY STATE ---
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- 1. WEBSOCKET LISTENER ---
  useEffect(() => {
    socket.on('verdict_update', (data) => {
      console.log("🔔 Python AI Finished!", data);
      setFinalVerdict(data);
      setStatus('complete');
    });

    return () => socket.off('verdict_update');
  }, []);

  // --- 2. HISTORY FETCHING LOGIC ---
  useEffect(() => {
    if (activeTab === 'history') {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await api.get('/applications/me');
          setHistory(res.data.applications || []);
        } catch (error) {
          console.error("Failed to fetch history:", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('finguard_token');
    localStorage.removeItem('finguard_role');
    navigate('/login');
  };

  // --- 3. SECURE UPLOAD SEQUENCE (Untouched) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.aadhaar || !files.pan || !files.salary) {
      alert("Please upload all 3 required documents.");
      return;
    }

    try {
      setStatus('initializing');

      const initRes = await api.post('/applications/initialize', {
        requestedAmount: Number(formData.amount),
        cibilScore: Number(formData.cibil),
        documentManifest: ['aadhaar.pdf', 'pan.pdf', 'salary.pdf']
      });
      
      const { applicationId, bundleManifest } = initRes.data;

      socket.emit('join_application_room', applicationId);

      setStatus('uploading');
      
      const uploadPromises = bundleManifest.map(async (doc) => {
        const fileKey = doc.filename.split('.')[0]; 
        const actualFile = files[fileKey];

        await fetch(doc.uploadUrl, {
          method: 'PUT',
          body: actualFile,
          headers: { 'Content-Type': 'application/pdf' }
        });
      });

      await Promise.all(uploadPromises);

      setStatus('processing');
      await api.post(`/applications/${applicationId}/finalize`);

    } catch (error) {
      console.error("Upload Error:", error);
      setStatus('idle');
      alert("Something went wrong. Check the console.");
    }
  };

  const renderFileUploader = (label, key) => (
    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-xl bg-gray-800 hover:border-blue-500 hover:bg-gray-750 transition duration-200">
      <span className="text-gray-300 font-bold mb-3 text-sm text-center">{label}</span>
      <label className="cursor-pointer bg-gray-700 hover:bg-blue-600 border border-gray-600 hover:border-blue-500 text-white text-xs font-bold py-2 px-4 rounded shadow transition w-full text-center">
        {files[key] ? 'Change File' : 'Select PDF'}
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          onChange={(e) => setFiles({...files, [key]: e.target.files[0]})} 
        />
      </label>
      <div className="h-4 mt-2">
        {files[key] ? (
          <span className="text-xs text-green-400 font-mono truncate block max-w-[120px]">
            ✓ {files[key].name}
          </span>
        ) : (
          <span className="text-xs text-gray-500 italic block">No file chosen</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col font-sans">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow">
            FG
          </div>
          <span className="text-xl font-extrabold text-white tracking-wide">FinGuard</span>
        </div>
        
        {/* TAB NAVIGATION */}
        <div className="flex space-x-6 items-center">
          <button 
            onClick={() => setActiveTab('apply')}
            className={`font-semibold transition ${activeTab === 'apply' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-400 hover:text-white'}`}
          >
            Apply for Loan
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`font-semibold transition ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-400 hover:text-white'}`}
          >
            My History
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2"></div>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-gray-400 hover:text-red-400 transition"
          >
            Secure Logout
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-grow flex items-center justify-center p-6">
        
        {activeTab === 'apply' ? (
          /* --- TAB 1: UPLOAD FORM --- */
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-700 relative overflow-hidden">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-white">Application Portal</h1>
              <p className="text-gray-400 mt-2 text-sm">Secure Client Ingestion Gateway</p>
            </div>

            {status === 'idle' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Requested Amount (₹)</label>
                    <input 
                      type="number" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">CIBIL Score</label>
                    <input 
                      type="number" 
                      value={formData.cibil} 
                      onChange={(e) => setFormData({...formData, cibil: e.target.value})} 
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition shadow-inner" 
                    />
                  </div>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                  <label className="block font-bold text-gray-300 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Encrypted Vault Upload (PDF)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderFileUploader("Aadhaar Document", "aadhaar")}
                    {renderFileUploader("PAN Card", "pan")}
                    {renderFileUploader("Salary Slip", "salary")}
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
                  Lock & Submit Package
                </button>
              </form>
            )}

            {/* LOADING STATES */}
            {status === 'initializing' && (
              <div className="py-16 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-blue-400 font-bold animate-pulse text-lg">Requesting secure vault keys...</p>
              </div>
            )}
            
            {status === 'uploading' && (
              <div className="py-16 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-yellow-400 font-bold animate-pulse text-lg">Uploading directly to Vault...</p>
              </div>
            )}
            
            {status === 'processing' && (
              <div className="py-16 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-red-400 font-bold animate-pulse text-lg">Documents locked. AI Forensics analyzing...</p>
              </div>
            )}

            {status === 'complete' && finalVerdict && (
              <div className="text-center mt-6 p-8 border-2 border-green-500 rounded-xl bg-green-900/20 backdrop-blur-sm">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-green-400 mb-4">Analysis Complete</h2>
                <div className="text-gray-300 space-y-2 mb-8 bg-gray-900/50 p-4 rounded-lg inline-block text-left min-w-[250px]">
                  <p className="flex justify-between"><span>System Verdict:</span> <span className="font-mono text-white font-bold">{finalVerdict.status}</span></p>
                  <p className="flex justify-between"><span>Risk Matrix:</span> <span className="font-mono text-white font-bold">{finalVerdict.risk}</span></p>
                </div>
                <div>
                  <button onClick={() => setStatus('idle')} className="text-sm text-gray-400 hover:text-white underline font-semibold transition">
                    Submit Another Package
                  </button>
                </div>
              </div>
            )}
          </div>

        ) : (

          /* --- TAB 2: HISTORY DASHBOARD --- */
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-700">
            <h2 className="text-3xl font-extrabold text-white mb-8 border-b border-gray-700 pb-4">My Application History</h2>
            
            {loadingHistory ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Fetching secure vault records...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 text-center bg-gray-900/50 rounded-xl border border-gray-700 border-dashed">
                <p className="text-gray-400 text-lg">No application records found.</p>
                <button 
                  onClick={() => setActiveTab('apply')}
                  className="mt-4 text-blue-400 hover:text-blue-300 font-bold underline"
                >
                  Start your first application
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-gray-400 text-sm uppercase tracking-wider">
                      <th className="py-4 px-6 rounded-tl-lg">Date Submitted</th>
                      <th className="py-4 px-6">Requested Amount</th>
                      <th className="py-4 px-6 rounded-tr-lg">Live Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {history.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-750 transition duration-150">
                        <td className="py-5 px-6 text-gray-300 font-medium">
                          {new Date(app.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-5 px-6 text-white font-bold">
                          ₹{app.requested_amount.toLocaleString()}
                        </td>
                        <td className="py-5 px-6">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                            app.overall_status === 'APPROVED' ? 'bg-green-900/40 text-green-400 border border-green-800' :
                            app.overall_status === 'REJECTED' ? 'bg-red-900/40 text-red-400 border border-red-800' :
                            app.overall_status.includes('PENDING') || app.overall_status === 'PROCESSING' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' :
                            'bg-gray-700 text-gray-300 border border-gray-600'
                          }`}>
                            {app.overall_status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}