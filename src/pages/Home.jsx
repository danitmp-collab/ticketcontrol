import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col animate-in fade-in duration-500 max-w-md mx-auto w-full">
      {/* Hero Section */}
      <section className="mt-8 mb-8 flex flex-col items-center text-center">
        <div className="w-full aspect-[8/3] rounded-2xl overflow-hidden bg-surface-container mb-6 shadow-sm border border-outline-variant/30 flex items-center justify-center">
          <img 
            alt="Ilustración de gestión de tickets" 
            className="w-full h-full object-cover opacity-90" 
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop"
          />
        </div>
        <h1 className="text-3xl font-headline font-bold text-on-surface mb-2 tracking-tight">TicketControl</h1>
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
          onClick={() => navigate('/consultas')}
          className="w-full h-14 bg-[#f3e8ff] text-[#6b21a8] rounded-xl font-headline font-semibold flex items-center justify-center gap-4 active:scale-[0.98] transition-all duration-150"
        >
          <span className="material-symbols-outlined">search</span>
          Consultas
        </button>

        <button 
          onClick={() => navigate('/estadisticas')}
          className="w-full h-14 bg-[#ffedd5] text-[#9a3412] rounded-xl font-headline font-semibold flex items-center justify-center gap-4 active:scale-[0.98] transition-all duration-150"
        >
          <span className="material-symbols-outlined">bar_chart</span>
          Estadísticas
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          className="btn-outline"
        >
          <span className="material-symbols-outlined">settings</span>
          Ajustes
        </button>
      </nav>
    </div>
  );
};

export default Home;
