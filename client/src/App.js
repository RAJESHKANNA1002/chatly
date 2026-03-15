import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;