import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import TicketsCategory from './pages/TicketsCategory';
import Tickets from './pages/Tickets';
import Settings from './pages/Settings';
import NewTicket from './pages/NewTicket';
import Scanner from './pages/Scanner';
import TicketDetail from './pages/TicketDetail';
import Login from './pages/Login';
import Consultas from './pages/Consultas';
import Estadisticas from './pages/Estadisticas';

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Flujo de Introducción (Escaneo) */}
        <Route path="/new" element={<NewTicket />} />
        <Route path="/new/scan/:category" element={<Scanner />} />
        
        {/* Flujo de Consulta (Historial) */}
        <Route path="/tickets" element={<TicketsCategory />} />
        <Route path="/tickets/list/:category" element={<Tickets />} />
        <Route path="/tickets/detail/:id" element={<TicketDetail />} />
        
        {/* Consultas y Estadísticas */}
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        
        {/* Ajustes */}
        <Route path="/settings" element={<Settings />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ProtectedRoutes />
    </AuthProvider>
  );
}

export default App;
