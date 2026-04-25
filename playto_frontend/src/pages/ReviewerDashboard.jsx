import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function ReviewerDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [subsRes, statsRes] = await Promise.all([
        api.get('/submissions/'),
        api.get('/reviewer/stats/')
      ]);
      setSubmissions(subsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (action) => {
    try {
      await api.post(`/submissions/${selectedSub.id}/transition/`, { action, notes });
      setSelectedSub(null);
      setNotes('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatHours = (seconds) => (seconds / 3600).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Reviewer Dashboard</h1>
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">In Queue</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.queue_size}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Avg Time (hrs)</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatHours(stats.avg_time_in_queue_seconds)}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Approval Rate (7d)</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approval_rate_7d.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {selectedSub ? (
          <div className="bg-white shadow rounded-lg p-6">
            <button onClick={() => setSelectedSub(null)} className="mb-6 text-blue-600 hover:underline flex items-center">&larr; Back to Queue</button>
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Review Target: {selectedSub.merchant_info?.username}</h2>
            
            {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>}

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-lg mb-6 border">
              <div><span className="text-gray-500 font-medium">Name:</span> {selectedSub.first_name} {selectedSub.last_name}</div>
              <div><span className="text-gray-500 font-medium">Email:</span> {selectedSub.email}</div>
              <div><span className="text-gray-500 font-medium">Phone:</span> {selectedSub.phone}</div>
              <div><span className="text-gray-500 font-medium">Business:</span> {selectedSub.business_name} ({selectedSub.business_type})</div>
              <div><span className="text-gray-500 font-medium">Expected Vol (USD):</span> ${selectedSub.expected_volume_usd}</div>
              <div><span className="text-gray-500 font-medium">Status:</span> <span className="uppercase text-blue-700 font-bold ml-1">{selectedSub.status.replace('_', ' ')}</span></div>
            </div>

            <h3 className="font-bold text-lg mb-3">Associated Documents</h3>
            <div className="flex gap-4 mb-8">
              {selectedSub.pan_document && <a href={`http://localhost:8000${selectedSub.pan_document}`} target="_blank" className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition">View PAN</a>}
              {selectedSub.aadhaar_document && <a href={`http://localhost:8000${selectedSub.aadhaar_document}`} target="_blank" className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition">View Aadhaar</a>}
              {selectedSub.bank_statement && <a href={`http://localhost:8000${selectedSub.bank_statement}`} target="_blank" className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition">View Bank Stmt</a>}
            </div>

            {selectedSub.status === 'under_review' && (
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes to Merchant (Required for Request Info)</label>
                <textarea 
                  className="w-full border border-gray-300 rounded p-3 mb-4 outline-none focus:ring-blue-500 focus:border-blue-500" 
                  rows="3" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter specific reasons for rejection or requested info here..."
                />
                <div className="flex gap-4">
                  <button onClick={() => handleAction('approve')} className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition">Approve KYC</button>
                  <button onClick={() => handleAction('reject')} className="px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition">Reject KYC</button>
                  <button onClick={() => handleAction('request_info')} className="px-6 py-2 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-600 transition">Request Details</button>
                </div>
              </div>
            )}
            
            {selectedSub.status === 'submitted' && (
               <div className="border-t pt-6">
                <button onClick={() => handleAction('review')} className="px-6 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700 transition">Start Dedicated Review</button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Merchant Account</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map(sub => (
                  <tr key={sub.id} className={sub.is_at_risk ? 'bg-red-50 hover:bg-red-100 transition' : 'hover:bg-gray-50 transition'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sub.merchant_info?.username}</div>
                      <div className="text-sm text-gray-500">{sub.email || 'Pending...'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{sub.business_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center h-full pt-6 border-b-0 space-x-2">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        sub.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        sub.status === 'under_review' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                      {sub.is_at_risk && <span className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase animate-pulse shadow-sm">SLA Risk &gt;24h</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setSelectedSub(sub)} className="text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition">View / Evaluate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {submissions.length === 0 && <div className="p-12 text-center text-gray-500 font-medium">The queue is completely clear.</div>}
          </div>
        )}
      </main>
    </div>
  );
}
