import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for detail
  const ticket = {
    shop: 'Mercadona',
    date: '15/05/2026',
    time: '14:30',
    amount: '45.20€',
    category: 'Supermercado',
    items: [
      { name: 'Leche Desnatada', price: '1.20€' },
      { name: 'Pan de Molde', price: '2.10€' },
      { name: 'Pechuga de Pollo', price: '5.50€' },
      { name: 'Aceite de Oliva', price: '36.40€' },
    ]
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
        <h1 className="text-2xl font-headline font-bold text-on-surface">Detalle del Ticket</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-lg overflow-hidden flex flex-col">
        <div className="p-8 flex flex-col items-center text-center border-b border-outline-variant/10">
          <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center text-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-4xl">shopping_cart</span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">{ticket.shop}</h2>
          <p className="text-on-surface-variant font-medium">{ticket.category}</p>
          <div className="mt-4 text-4xl font-headline font-extrabold text-primary">
            {ticket.amount}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Fecha</span>
            <span className="text-on-surface font-bold">{ticket.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Hora</span>
            <span className="text-on-surface font-bold">{ticket.time}</span>
          </div>
          
          <div className="mt-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Productos</h3>
            <div className="flex flex-col gap-2">
              {ticket.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-on-surface">{item.name}</span>
                  <span className="text-on-surface font-semibold">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-surface-container-low flex gap-3">
          <button className="flex-1 h-12 bg-white border border-outline-variant rounded-xl font-semibold text-primary flex items-center justify-center gap-2 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-sm">share</span>
            Compartir
          </button>
          <button className="flex-1 h-12 bg-white border border-outline-variant rounded-xl font-semibold text-error flex items-center justify-center gap-2 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-sm">delete</span>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
