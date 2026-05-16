import React from 'react';
import { useNavigate } from 'react-router-dom';

const NewTicket = () => {
  const navigate = useNavigate();
  
  const categories = [
    { id: 'supermarket', label: 'Supermercado', icon: 'shopping_basket', color: 'bg-primary' },
    { id: 'restaurant', label: 'Restaurante', icon: 'restaurant', color: 'bg-secondary' },
    { id: 'others', label: 'Varios', icon: 'more_horiz', color: 'bg-tertiary' },
  ];

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h1 className="text-2xl font-headline font-bold text-on-surface mt-6 mb-2">Escaneo Inteligente</h1>
      <p className="text-on-surface-variant mb-8 text-sm">Selecciona la categoría para optimizar el reconocimiento del ticket.</p>

      <div className="flex flex-col gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/new/scan/${cat.id}`)}
            className="w-full p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 flex items-center gap-6 shadow-sm hover:border-primary/50 active:scale-[0.98] transition-all group text-left"
          >
            <div className={`w-14 h-14 rounded-2xl ${cat.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-headline font-bold text-on-surface">{cat.label}</h3>
              <p className="text-xs text-on-surface-variant">Abrir visor de cámara</p>
            </div>
            <span className="material-symbols-outlined text-primary">arrow_forward_ios</span>
          </button>
        ))}
      </div>

      <div className="mt-12 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex gap-4 items-center">
        <span className="material-symbols-outlined text-primary">tips_and_updates</span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Elegir la categoría correcta ayuda al motor de IA a identificar los productos y el IVA con mayor precisión.
        </p>
      </div>
    </div>
  );
};

export default NewTicket;
