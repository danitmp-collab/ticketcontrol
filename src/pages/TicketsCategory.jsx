import React from 'react';
import { useNavigate } from 'react-router-dom';

const TicketsCategory = () => {
  const navigate = useNavigate();

  const categories = [
    { id: 'supermarket', label: 'Supermercado', count: 8, icon: 'shopping_basket', color: 'text-primary', bg: 'bg-primary-container/30' },
    { id: 'restaurant', label: 'Restaurante', count: 3, icon: 'restaurant', color: 'text-secondary', bg: 'bg-secondary-container/30' },
    { id: 'others', label: 'Varios', count: 1, icon: 'more_horiz', color: 'text-tertiary', bg: 'bg-tertiary-container/30' },
    { id: 'all', label: 'Todos los tickets', count: 12, icon: 'receipt_long', color: 'text-on-surface', bg: 'bg-surface-container' },
  ];

  return (
    <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-headline font-bold text-on-surface mt-6 mb-2">Consulta</h1>
      <p className="text-on-surface-variant mb-8 text-sm">Explora tus gastos por categoría o visualiza el historial completo.</p>

      <div className="grid grid-cols-1 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/tickets/list/${cat.id}`)}
            className="w-full p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between hover:bg-surface-container-low active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
              </div>
              <div className="text-left">
                <h3 className="font-headline font-bold text-on-surface">{cat.label}</h3>
                <p className="text-xs text-on-surface-variant font-medium">{cat.count} recibos guardados</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold font-headline uppercase tracking-wider">Ver listado</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Gasto Total</p>
          <p className="text-xl font-headline font-extrabold text-primary">124.50€</p>
        </div>
        <div className="bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Días activos</p>
          <p className="text-xl font-headline font-extrabold text-secondary">24</p>
        </div>
      </div>
    </div>
  );
};

export default TicketsCategory;
