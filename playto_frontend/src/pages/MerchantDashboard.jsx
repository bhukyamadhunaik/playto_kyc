import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function MerchantDashboard() {
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    business_name: '', business_type: '', expected_volume_usd: ''
  });
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await api.get('/submissions/');
      if (res.data.length > 0) {
        const sub = res.data[0];
        setSubmission(sub);
        setFormData({
          first_name: sub.first_name || '', last_name: sub.last_name || '', email: sub.email || '', phone: sub.phone || '',
          business_name: sub.business_name || '', business_type: sub.business_type || '', expected_volume_usd: sub.expected_volume_usd || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleSaveDraft = async () => {
    setError('');
    const form = new FormData();
    Object.entries(formData).forEach(([k, v]) => form.append(k, v));
    Object.entries(files).forEach(([k, v]) => { if (v) form.append(k, v); });

    try {
      if (submission) {
        await api.patch(`/submissions/${submission.id}/`, form);
      } else {
        await api.post('/submissions/', form);
      }
      loadData();
    } catch (err) {
      setError(err.response?.data?.pan_document?.[0] || 'Error saving draft. Check input formats/sizes.');
    }
  };

  const handleSubmitKYC = async () => {
    if (!submission) return;
    try {
      await api.post(`/submissions/${submission.id}/transition/`, { action: 'submit' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const isLocked = submission && ['submitted', 'under_review', 'approved', 'rejected'].includes(submission.status);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Merchant Dashboard</h1>
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
        {submission && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between shadow-sm border border-blue-100">
            <span className="font-semibold text-blue-900">Current Status: <span className="uppercase">{submission.status.replace('_', ' ')}</span></span>
            {submission.status === 'more_info_requested' && (
              <span className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">Reviewer Note: {submission.reviewer_notes}</span>
            )}
          </div>
        )}

        {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded border border-red-200">{error}</div>}

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700">First Name</label><input disabled={isLocked} className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2" name="first_name" value={formData.first_name} onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-gray-700">Last Name</label><input disabled={isLocked} className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2" name="last_name" value={formData.last_name} onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-gray-700">Email</label><input disabled={isLocked} className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2" name="email" value={formData.email} onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-gray-700">Phone</label><input disabled={isLocked} className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2" name="phone" value={formData.phone} onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-gray-700">Business Name</label><input disabled={isLocked} className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2" name="business_name" value={formData.business_name} onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-gray-700">Business Type</label><input disabled={isLocked} className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2" name="business_type" value={formData.business_type} onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-gray-700">Expected Volume (USD)</label><input type="number" disabled={isLocked} className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2" name="expected_volume_usd" value={formData.expected_volume_usd} onChange={handleChange} /></div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium text-gray-900 pb-2">Documents <span className="text-sm font-normal text-gray-500">(Max 5MB: PDF, JPG, PNG)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-gray-50 p-4 rounded border">
                 <label className="block font-semibold mb-2">PAN Document</label>
                 {!isLocked && <input type="file" name="pan_document" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />}
                 {submission?.pan_document && <a href={`http://localhost:8000${submission.pan_document}`} target="_blank" rel="noreferrer" className="inline-block mt-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700">View Active File</a>}
              </div>
              <div className="bg-gray-50 p-4 rounded border">
                 <label className="block font-semibold mb-2">Aadhaar Document</label>
                 {!isLocked && <input type="file" name="aadhaar_document" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />}
                 {submission?.aadhaar_document && <a href={`http://localhost:8000${submission.aadhaar_document}`} target="_blank" rel="noreferrer" className="inline-block mt-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700">View Active File</a>}
              </div>
              <div className="bg-gray-50 p-4 rounded border">
                 <label className="block font-semibold mb-2">Bank Statement</label>
                 {!isLocked && <input type="file" name="bank_statement" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />}
                 {submission?.bank_statement && <a href={`http://localhost:8000${submission.bank_statement}`} target="_blank" rel="noreferrer" className="inline-block mt-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700">View Active File</a>}
              </div>
            </div>
          </div>

          {!isLocked && (
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button onClick={handleSaveDraft} className="px-6 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 transition">Save Details</button>
              <button onClick={handleSubmitKYC} className="px-6 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700 transition" disabled={!submission}>Submit to Reviewer</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
