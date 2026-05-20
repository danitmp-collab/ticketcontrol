import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Consultas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc'); // 'price_asc', 'date_desc'

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      // Consultar productos filtrados por término de búsqueda y usuario
      // Hacemos un join de tickets para obtener el establecimiento y la fecha
      const { data, error } = await supabase
        .from('ticket_items')
        .select(`
          id,
          ticket_id,
          item_name,
          quantity,
          unit_price,
          total_price,
          category,
          comparable_unit_price,
          tickets (
            establishment,
            ticket_date,
            ticket_type
          )
        `)
        .eq('user_id', user.id)
        .ilike('item_name', `%${searchTerm.trim()}%`);

      if (error) throw error;

      // Ordenar resultados según preferencia
      const sortedData = sortResults(data || [], sortBy);
      setResults(sortedData);
    } catch (error) {
      console.error('Error al buscar productos:', error.message);
      alert('Error en la búsqueda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sortResults = (data, sortOption) => {
    const list = [...data];
    if (sortOption === 'price_asc') {
      // Ordenar por precio unitario comparable (menor a mayor)
      return list.sort((a, b) => {
        const priceA = a.comparable_unit_price ?? 999999;
        const priceB = b.comparable_unit_price ?? 999999;
        return priceA - priceB;
      });
    } else if (sortOption === 'date_desc') {
      // Ordenar por fecha del ticket (más reciente a más antiguo)
      return list.sort((a, b) => {
        const dateA = new Date(a.tickets?.ticket_date || '1970-01-01');
        const dateB = new Date(b.tickets?.ticket_date || '1970-01-01');
        return dateB - dateA;
      });
    }
    return list;
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setResults(prev => sortResults(prev, newSortBy));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'comida': return 'restaurant';
      case 'bebida': return 'local_bar';
      case 'limpieza': return 'cleaning_services';
      case 'hogar': return 'home';
      default: return 'shopping_bag';
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-md mx-auto w-full p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Comparador de Precios</h1>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="w-full flex gap-2 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60">search</span>
          <input
            type="text"
            placeholder="Ej. Leche, huevos, café..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface text-sm focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !searchTerm.trim()}
          className="h-12 px-6 bg-primary text-white font-headline font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Buscar'
          )}
        </button>
      </form>

      {/* Results and Filters */}
      {searched && !loading && results.length > 0 && (
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-xs text-on-surface-variant font-medium">
            {results.length} {results.length === 1 ? 'resultado' : 'resultados'} encontrados
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleSortChange('price_asc')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                sortBy === 'price_asc'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Más barato
            </button>
            <button
              onClick={() => handleSortChange('date_desc')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                sortBy === 'date_desc'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Más reciente
            </button>
          </div>
        </div>
      )}

      {/* Main Results Container */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-on-surface-variant">Buscando productos en tus tickets...</p>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] shadow-sm">
            <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">manage_search</span>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Compara tus compras</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-[260px]">
              Escribe el nombre de un artículo para ver dónde y cuándo lo compraste más barato.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] shadow-sm">
            <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">search_off</span>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Sin resultados</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-[260px]">
              No encontramos ningún producto que coincida con "{searchTerm}" en tus tickets guardados.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-8">
            {results.map((item, idx) => {
              const isCheapest = sortBy === 'price_asc' && idx === 0;
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/tickets/detail/${item.ticket_id}`)}
                  className={`p-4 bg-surface-container-lowest border rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/40 active:scale-[0.98] transition-all cursor-pointer group ${
                    isCheapest ? 'border-success/30 bg-success/[0.02]' : 'border-outline-variant/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icono de categoría */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCheapest ? 'bg-success/10 text-success' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {getCategoryIcon(item.category)}
                      </span>
                    </div>
                    
                    {/* Detalles */}
                    <div className="min-w-0">
                      <h4 className="font-headline font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {item.item_name}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">{item.tickets?.establishment}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <span>{formatDate(item.tickets?.ticket_date)}</span>
                      </p>
                      {item.quantity && item.quantity !== 1 && (
                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                          Cant: {item.quantity} unidades
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Precios */}
                  <div className="text-right flex flex-col items-end shrink-0 pl-3">
                    <span className="text-base font-bold text-on-surface font-headline">
                      {(item.comparable_unit_price ?? item.total_price ?? 0).toFixed(2)} €
                      <span className="text-[10px] font-normal text-on-surface-variant ml-0.5">/ud</span>
                    </span>
                    {item.total_price && item.quantity > 1 && (
                      <span className="text-[10px] text-on-surface-variant/70">
                        Total: {item.total_price.toFixed(2)} €
                      </span>
                    )}
                    {isCheapest && (
                      <span className="mt-1 text-[8px] font-bold text-success bg-success/15 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        El más barato
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultas;
