import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Estadisticas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [view, setView] = useState('main'); // 'main', 'gastos', 'restaurant', 'supermarket'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async (category) => {
    setLoading(true);
    setView(category);
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('establishment, total_amount')
        .eq('user_id', user.id)
        .eq('ticket_type', category);

      if (error) throw error;

      // Group by establishment
      const grouped = tickets.reduce((acc, ticket) => {
        const est = ticket.establishment || 'Desconocido';
        if (!acc[est]) {
          acc[est] = { establishment: est, count: 0, total: 0 };
        }
        acc[est].count += 1;
        acc[est].total += parseFloat(ticket.total_amount || 0);
        return acc;
      }, {});

      const result = Object.values(grouped).sort((a, b) => b.total - a.total);
      setData(result);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (view === 'main') {
      return (
        <div className="flex flex-col gap-4 mt-6">
          <button 
            onClick={() => setView('gastos')}
            className="w-full p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-headline font-bold text-on-surface">Gastos</h3>
              <p className="text-xs text-on-surface-variant">Análisis de gastos por categoría</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward_ios</span>
          </button>
        </div>
      );
    }

    if (view === 'gastos') {
      return (
        <div className="flex flex-col gap-4 mt-6">
          <button 
            onClick={() => fetchStats('restaurant')}
            className="w-full p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-3xl">restaurant</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-headline font-bold text-on-surface">Restaurantes</h3>
              <p className="text-xs text-on-surface-variant">Gastos agrupados por establecimiento</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward_ios</span>
          </button>

          <button 
            onClick={() => fetchStats('supermarket')}
            className="w-full p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-3xl">shopping_basket</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-headline font-bold text-on-surface">Supermercados</h3>
              <p className="text-xs text-on-surface-variant">Gastos agrupados por establecimiento</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward_ios</span>
          </button>
        </div>
      );
    }

    // view === 'restaurant' || view === 'supermarket'
    return (
      <div className="flex flex-col mt-6 gap-3">
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length > 0 ? (
          data.map((item, index) => (
            <div key={index} className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
              <div>
                <h4 className="font-headline font-bold text-on-surface">{item.establishment}</h4>
                <p className="text-xs text-on-surface-variant">{item.count} {item.count === 1 ? 'ticket' : 'tickets'}</p>
              </div>
              <div className="text-lg font-headline font-bold text-primary">
                {item.total.toFixed(2)}€
              </div>
            </div>
          ))
        ) : (
          <div className="text-center mt-10">
            <p className="text-on-surface-variant">No hay tickets guardados en esta categoría.</p>
          </div>
        )}
      </div>
    );
  };

  const handleBack = () => {
    if (view === 'main') {
      navigate(-1);
    } else if (view === 'gastos') {
      setView('main');
    } else {
      setView('gastos');
    }
  };

  const getTitle = () => {
    switch(view) {
      case 'gastos': return 'Gastos';
      case 'restaurant': return 'Restaurantes';
      case 'supermarket': return 'Supermercados';
      default: return 'Estadísticas';
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-md mx-auto w-full p-4">
      <div className="flex items-center mb-2">
        <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">{getTitle()}</h1>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default Estadisticas;
