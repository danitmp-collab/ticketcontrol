import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({ thisMonthAmount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeStats = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tickets')
          .select('total_amount, ticket_date')
          .eq('user_id', user.id);

        if (error) throw error;

        let thisMonthSum = 0;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-indexed

        if (data) {
          data.forEach(ticket => {
            if (ticket.ticket_date) {
              const [year, month] = ticket.ticket_date.split('-').map(Number);
              if (year === currentYear && month === currentMonth) {
                thisMonthSum += parseFloat(ticket.total_amount || 0);
              }
            }
          });
        }

        setStats({
          thisMonthAmount: thisMonthSum,
          totalCount: data ? data.length : 0
        });
      } catch (error) {
        console.error('Error fetching home stats:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHomeStats();
    }
  }, [user]);

  return (
    <div className="flex flex-col animate-in fade-in duration-500 max-w-md mx-auto w-full">
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
          {loading ? (
            <div className="h-8 w-16 bg-surface-container rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-headline font-bold text-primary">{stats.thisMonthAmount.toFixed(2)}€</p>
          )}
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-bold text-on-surface-variant block mb-1 uppercase tracking-wider">Recibos</span>
          {loading ? (
            <div className="h-8 w-10 bg-surface-container rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-headline font-bold text-primary">{stats.totalCount}</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
