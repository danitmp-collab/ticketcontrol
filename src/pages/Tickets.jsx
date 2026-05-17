import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Tickets = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('ticket_date', { ascending: false });

        if (category && category !== 'all') {
          query = query.eq('ticket_type', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTickets();
    }
  }, [category, user]);

  const getTitle = () => {
    switch(category) {
      case 'supermarket': return 'Tickets Super';
      case 'restaurant': return 'Tickets Restaurante';
      case 'others': return 'Tickets Varios';
      default: return 'Todos los Tickets';
    }
  };

  const getCategoryLabel = (type) => {
    switch(type) {
      case 'supermarket': return 'Supermercado';
      case 'restaurant': return 'Restaurante';
      case 'others': return 'Varios';
      default: return 'Otro';
    }
  };

  const getCategoryIcon = (type) => {
    switch(type) {
      case 'supermarket': return 'shopping_basket';
      case 'restaurant': return 'restaurant';
      case 'others': return 'more_horiz';
      default: return 'receipt';
    }
  };

  const getCategoryColor = (type) => {
    switch(type) {
      case 'supermarket': return 'bg-primary-container/30 text-primary';
      case 'restaurant': return 'bg-secondary-container/30 text-secondary';
      case 'others': return 'bg-tertiary-container/30 text-tertiary';
      default: return 'bg-surface-container-high text-on-surface';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex flex-col animate-in slide-in-from-right-4 duration-500 max-w-md mx-auto w-full">
      <div className="flex items-center gap-4 mt-6 mb-6">
        <button 
          onClick={() => navigate('/tickets')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-primary active:scale-90 transition-all hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">{getTitle()}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-on-surface-variant">Cargando tus tickets...</p>
          </div>
        ) : tickets.length > 0 ? (
          tickets.map(ticket => (
            <Link 
              key={ticket.id} 
              to={`/tickets/detail/${ticket.id}`}
              className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-primary/20"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(ticket.ticket_type)}`}>
                <span className="material-symbols-outlined">{getCategoryIcon(ticket.ticket_type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline font-semibold text-on-surface truncate">{ticket.establishment}</h3>
                <p className="text-xs text-on-surface-variant truncate">
                  {formatDate(ticket.ticket_date)} • {getCategoryLabel(ticket.ticket_type)}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="font-headline font-bold text-primary">
                  {typeof ticket.total_amount === 'number' ? ticket.total_amount.toFixed(2) : parseFloat(ticket.total_amount).toFixed(2)}€
                </p>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-sm">chevron_right</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center bg-surface-container-low rounded-3xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">search_off</span>
            <p className="text-on-surface-variant font-medium">No hay tickets en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
