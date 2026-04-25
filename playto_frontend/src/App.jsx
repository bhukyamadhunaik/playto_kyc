import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDashboard from './pages/MerchantDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';

function App() {
  const PrivateRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) return <Navigate to="/login" />;
    
    if (userStr && roleRequired) {
      const user = JSON.parse(userStr);
      if (user.role !== roleRequired) {
        return <Navigate to={user.role === 'MERCHANT' ? '/merchant' : '/reviewer'} />;
      }
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/merchant" element={<PrivateRoute roleRequired="MERCHANT"><MerchantDashboard /></PrivateRoute>} />
        <Route path="/reviewer" element={<PrivateRoute roleRequired="REVIEWER"><ReviewerDashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
