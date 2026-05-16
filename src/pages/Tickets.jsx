import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const Tickets = () => {
  const { category } = useParams();
  const navigate = useNavigate();

  const allTickets = [
    { id: 1, shop: 'Mercadona', date: '15/05/2026', amount: '45.20€', category: 'supermarket', categoryLabel: 'Supermercado' },
    { id: 2, shop: 'Restaurante El Paso', date: '14/05/2026', amount: '32.00€', category: 'restaurant', categoryLabel: 'Restaurante' },
    { id: 3, shop: 'Gasolinera Repsol', date: '12/05/2026', amount: '60.00€', category: 'others', categoryLabel: 'Varios' },
    { id: 4, shop: 'Zara', date: '10/05/2026', amount: '24.99€', category: 'others', categoryLabel: 'Varios' },
  ];

  const filteredTickets = !category || category === 'all' 
    ? allTickets 
    : allTickets.filter(t => t.category === category);

  const getTitle = () => {
    switch(category) {
      case 'supermarket': return 'Tickets Super';
      case 'restaurant': return 'Tickets Restaurante';
      case 'others': return 'Tickets Varios';
      default: return 'Todos los Tickets';
    }
  };

  return (
    <div className="flex flex-col animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mt-6 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-primary active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">{getTitle()}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(ticket => (
            <Link 
              key={ticket.id} 
              to={`/tickets/detail/${ticket.id}`}
              className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">receipt</span>
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-semibold text-on-surface">{ticket.shop}</h3>
                <p className="text-xs text-on-surface-variant">{ticket.date} • {ticket.categoryLabel}</p>
              </div>
              <div className="text-right">
                <p className="font-headline font-bold text-primary">{ticket.amount}</p>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">search_off</span>
            <p className="text-on-surface-variant font-medium">No hay tickets en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
