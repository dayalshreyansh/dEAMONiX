import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-blue-500/30">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed w-full z-50 top-0 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
              FG
            </div>
            <span className="text-2xl font-extrabold text-white tracking-wide">FinGuard</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-bold text-gray-400">
            <a href="#features" className="hover:text-blue-400 transition">Engine</a>
            <a href="#security" className="hover:text-blue-400 transition">Security</a>
            <a href="#architecture" className="hover:text-blue-400 transition">Architecture</a>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 text-sm font-black bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition transform hover:-translate-y-0.5"
            >
              Command Center
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Abstract Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Operational v2.0</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight leading-tight">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Underwriting.</span><br/>Zero Fraud.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Protect your lending pipeline with bank-grade AI forensics. FinGuard analyzes structural metadata, cryptographic checksums, and pixel-level discrepancies in milliseconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={() => navigate('/apply')}
              className="px-8 py-4 text-lg font-black bg-white text-gray-950 hover:bg-gray-200 rounded-xl shadow-xl transition transform hover:-translate-y-1"
            >
              Simulate Client Portal
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 text-lg font-black bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white rounded-xl shadow-xl transition transform hover:-translate-y-1"
            >
              Open Command Center
            </button>
          </div>
        </div>
      </div>

      {/* --- FORENSIC ENGINE FEATURES --- */}
      <div id="features" className="py-24 bg-gray-900/50 border-t border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-4">The Multi-Layer Forensics Engine</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Documents are evaluated across structural, semantic, and visual layers to catch manipulation that human eyes miss.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition duration-300">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 border border-blue-800/50">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Structural & Cryptographic</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Executes Verhoeff checksum algorithms to validate identity numbers and scrapes hidden binary PDF metadata to flag illicit software streams like Photoshop or Canva.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition duration-300">
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-6 border border-purple-800/50">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Semantic Accounting Audits</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Advanced OCR extracts ledger rows from salary slips. The AI cross-references equations (Gross - Deductions) to ensure net pay amounts are mathematically flawless.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-red-500/50 transition duration-300">
              <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center mb-6 border border-red-800/50">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Pixel-Level Error Analysis</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Computer vision converts documents to pixel arrays and calculates Error Level Analysis (ELA) deviation metrics to map high-contrast visual forgery heatmaps.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ARCHITECTURE --- */}
      <div id="architecture" className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-8">Bimodal Infrastructure</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between text-left shadow-2xl">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-10">
              <h4 className="text-xl font-bold text-blue-400 mb-4">1. High-Concurrency Backend</h4>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Built on Node.js and Express, securely routing payloads through Role-Based Access Control (RBAC). Data is locked in PostgreSQL while static assets are vaulted in MinIO/S3.
              </p>
              <h4 className="text-xl font-bold text-purple-400 mb-4">2. Distributed Python Workers</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Heavy AI computations are offloaded to an asynchronous Python cluster via a Redis message broker, ensuring the main application never stalls during pixel analysis.
              </p>
            </div>
            <div className="md:w-1/2 bg-gray-950 border border-gray-800 rounded-xl p-6 font-mono text-xs text-green-400 overflow-x-auto shadow-inner">
              <p>{`> [Fabric Stream] Pushing payload...`}</p>
              <p>{`> 📦 [Bundle Ingestion] Target: app_8f2a`}</p>
              <p>{`> 🕵️‍♂️ [Metadata Forensics] Verified.`}</p>
              <p>{`> 📊 Semantic Math Audit: MATCH`}</p>
              <p>{`> 👁️  ELA Matrix Calculated: 1.2%`}</p>
              <p className="text-blue-400 mt-4">{`> ✅ Verdict: HUMAN_REVIEW_REQUIRED`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-950 border-t border-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center font-bold text-gray-500 mx-auto mb-6">
            FG
          </div>
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} FinGuard Underwriting Systems. All rights reserved.
          </p>
        </div>
      </footer>
      
    </div>
  );
}