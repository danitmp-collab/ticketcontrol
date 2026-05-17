import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [ticketItems, setTicketItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);

        // Carga paralela: ticket principal + items
        const [ticketResult, itemsResult] = await Promise.all([
          supabase
            .from('tickets')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('ticket_items')
            .select('id, item_name, quantity, unit_price, total_price, line_order')
            .eq('ticket_id', id)
            .eq('user_id', user.id)
            .order('line_order', { ascending: true }),
        ]);

        if (ticketResult.error) throw ticketResult.error;
        setTicket(ticketResult.data);

        // Items son opcionales — si falla, solo avisamos en consola
        if (itemsResult.error) {
          console.warn('[ticket_items] No se pudieron cargar los items:', itemsResult.error.message);
        } else {
          setTicketItems(itemsResult.data ?? []);
        }
      } catch (error) {
        console.error('Error fetching ticket:', error.message);
        alert('No se pudo cargar el detalle del ticket.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchTicket();
    }
  }, [id, user, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción borrará de forma permanente el registro y su imagen.')) {
      return;
    }

    setDeleting(true);
    try {
      // 1. Borrar archivo del Bucket de Supabase Storage si existe
      if (ticket && ticket.image_url) {
        const { error: storageError } = await supabase.storage
          .from('ticket-images')
          .remove([ticket.image_url]);
        
        if (storageError) {
          console.warn('Advertencia al borrar la imagen de storage:', storageError.message);
        }
      }

      // 2. Borrar registro de la Base de Datos
      const { error: dbError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      alert('Ticket eliminado correctamente.');
      navigate('/tickets');
    } catch (error) {
      console.error('Error deleting ticket:', error.message);
      alert('Hubo un error al eliminar el ticket: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (type) => {
    switch(type) {
      case 'supermarket': return 'Supermercado';
      case 'restaurant': return 'Restaurante';
      case 'others': return 'Varios';
      default: return type || 'Otro';
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 max-w-md mx-auto w-full">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant">Cargando detalles...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="flex flex-col animate-in slide-in-from-right-4 duration-500 max-w-md mx-auto w-full">
      <div className="flex items-center gap-4 mt-6 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-primary active:scale-90 transition-all hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Detalle del Ticket</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-lg overflow-hidden flex flex-col">
        {/* Main Card Header */}
        <div className="p-8 flex flex-col items-center text-center border-b border-outline-variant/10">
          <div className="w-20 h-20 rounded-2xl bg-primary-container/30 flex items-center justify-center text-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-4xl">{getCategoryIcon(ticket.ticket_type)}</span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">{ticket.establishment}</h2>
          <p className="text-on-surface-variant font-medium">{getCategoryLabel(ticket.ticket_type)}</p>
          <div className="mt-4 text-4xl font-headline font-extrabold text-primary">
            {typeof ticket.total_amount === 'number' ? ticket.total_amount.toFixed(2) : parseFloat(ticket.total_amount).toFixed(2)}€
          </div>
        </div>

        {/* Info Rows */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Fecha</span>
            <span className="text-on-surface font-bold">{formatDate(ticket.ticket_date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Categoría</span>
            <span className="text-on-surface font-bold">{getCategoryLabel(ticket.ticket_type)}</span>
          </div>

          {ticket.ticket_reference && (
            <div className="flex justify-between text-sm mt-4">
              <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Nº ticket / ref</span>
              <span className="text-on-surface font-bold">{ticket.ticket_reference}</span>
            </div>
          )}
          
          <div className="mt-2 border-t border-outline-variant/10 pt-4 text-left">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Notas</span>
            <p className="text-sm text-on-surface leading-relaxed bg-surface-container-low p-4 rounded-xl border border-outline-variant/5">
              {ticket.notes || 'Sin notas adicionales.'}
            </p>
          </div>

          {/* Secure Image Status Badge */}
          {ticket.image_url && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <div className="text-left">
                <p className="text-sm font-headline font-bold">Imagen guardada correctamente</p>
                <p className="text-[10px] opacity-80 leading-tight">El justificante se encuentra almacenado de forma segura en Storage privado.</p>
              </div>
            </div>
          )}
        </div>

        {/* Productos del ticket */}
        {ticketItems.length > 0 && (
          <div className="px-6 pb-2">
            <div className="bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-lg">list_alt</span>
                <h3 className="font-headline font-bold text-on-surface text-base">Productos del ticket</h3>
                <span className="ml-auto text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {ticketItems.length} líneas
                </span>
              </div>
              <div className="flex flex-col divide-y divide-outline-variant/10">
                {ticketItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm truncate">{item.item_name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {item.quantity != null && (
                          <span className="text-[11px] text-on-surface-variant">Cant: {item.quantity}</span>
                        )}
                        {item.unit_price != null && (
                          <span className="text-[11px] text-on-surface-variant">P.u: {parseFloat(item.unit_price).toFixed(2)}€</span>
                        )}
                      </div>
                    </div>
                    {item.total_price != null && (
                      <span className="font-headline font-bold text-primary text-sm whitespace-nowrap">
                        {parseFloat(item.total_price).toFixed(2)}€
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Panel */}
        <div className="p-6 bg-surface-container-low flex gap-3">
          <button 
            disabled={deleting}
            onClick={handleDelete}
            className={`flex-1 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all ${
              deleting 
                ? 'bg-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed' 
                : 'bg-error/10 hover:bg-error/15 text-error border border-error/20'
            }`}
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin"></div>
                Eliminando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">delete</span>
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
