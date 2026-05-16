import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="mt-8 mb-8 flex flex-col items-center text-center">
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container mb-6 shadow-sm border border-outline-variant/30 flex items-center justify-center">
          <img 
            alt="Ilustración de gestión de tickets" 
            className="w-full h-full object-cover opacity-90" 
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop"
          />
        </div>
        <h1 className="text-3xl font-headline font-bold text-on-surface mb-2 tracking-tight">TicketControl</h1>
        <p className="text-base font-body text-on-surface-variant max-w-[80%]">Guarda tus tickets fácilmente y mantén tus finanzas bajo control.</p>
      </section>

      {/* Actions Cluster */}
      <nav className="flex flex-col gap-4 mb-8">
        <button 
          onClick={() => navigate('/new')}
          className="btn-primary"
        >
          <span className="material-symbols-outlined">add_a_photo</span>
          Introducir ticket
        </button>
        
        <button 
          onClick={() => navigate('/tickets')}
          className="btn-secondary"
        >
          <span className="material-symbols-outlined">receipt_long</span>
          Consultar tickets
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          className="btn-outline"
        >
          <span className="material-symbols-outlined">settings</span>
          Ajustes
        </button>
      </nav>

      {/* Quick Stats Bento */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold text-on-surface-variant block mb-1 uppercase tracking-wider">Este mes</span>
          <p className="text-2xl font-headline font-bold text-primary">124.50€</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold text-on-surface-variant block mb-1 uppercase tracking-wider">Recibos</span>
          <p className="text-2xl font-headline font-bold text-primary">12</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
