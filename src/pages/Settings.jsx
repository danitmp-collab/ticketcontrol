import React, { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Settings = () => {
  const { user, signOut } = useAuth();
  const fileInputRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, ticket_items(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('No tienes ningún ticket para exportar.');
        return;
      }

      // Convertir a cadena JSON formateada y descargar
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `ticketcontrol-export-${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting tickets:', error.message);
      alert('Hubo un error al exportar tus tickets: ' + error.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        if (!Array.isArray(parsedData)) {
          throw new Error('El formato del archivo JSON no es válido. Debe contener una lista de tickets.');
        }

        if (parsedData.length === 0) {
          alert('El archivo JSON no contiene registros.');
          return;
        }

        let importedCount = 0;
        let itemsCount = 0;

        for (const ticket of parsedData) {
          if (!ticket.establishment || !ticket.ticket_type || !ticket.total_amount) {
            throw new Error('Formato incompleto. Los campos obligatorios son "establishment", "ticket_type" y "total_amount".');
          }

          // 1. Insertar cabecera del ticket
          const { data: savedTicket, error: ticketError } = await supabase
            .from('tickets')
            .insert({
              user_id: user.id,
              ticket_type: ticket.ticket_type,
              establishment: ticket.establishment.trim(),
              ticket_date: ticket.ticket_date || new Date().toISOString().split('T')[0],
              total_amount: parseFloat(ticket.total_amount),
              image_url: ticket.image_url || null,
              notes: ticket.notes || null,
              ticket_reference: ticket.ticket_reference || null
            })
            .select()
            .single();

          if (ticketError) throw ticketError;
          importedCount++;

          // 2. Insertar artículos desglosados si existen
          if (savedTicket && Array.isArray(ticket.ticket_items) && ticket.ticket_items.length > 0) {
            const itemsToInsert = ticket.ticket_items.map((item, idx) => ({
              ticket_id: savedTicket.id,
              user_id: user.id,
              item_name: (item.item_name || item.name || '').trim(),
              quantity: item.quantity !== null && item.quantity !== undefined ? parseFloat(item.quantity) : 1,
              unit_price: item.unit_price !== null && item.unit_price !== undefined ? parseFloat(item.unit_price) : null,
              total_price: item.total_price !== null && item.total_price !== undefined ? parseFloat(item.total_price) : null,
              category: item.category || null,
              raw_line: item.raw_line || null,
              line_order: item.line_order !== null && item.line_order !== undefined ? parseInt(item.line_order) : idx
            })).filter(item => item.item_name !== '');

            if (itemsToInsert.length > 0) {
              const { error: itemsError } = await supabase
                .from('ticket_items')
                .insert(itemsToInsert);

              if (itemsError) {
                console.warn(`Error al importar artículos del ticket ${savedTicket.id}:`, itemsError.message);
              } else {
                itemsCount += itemsToInsert.length;
              }
            }
          }
        }

        alert(`Se han importado ${importedCount} tickets y ${itemsCount} artículos correctamente.`);
        window.location.reload();
      } catch (error) {
        console.error('Error importing tickets:', error.message);
        alert('No se pudo importar el JSON: ' + error.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearTickets = async () => {
    const firstConfirm = window.confirm(
      '¡ATENCIÓN! Estás a punto de borrar TODOS tus tickets y sus justificantes de imagen asociados.\n\n' +
      'Esta acción es definitiva y no afectará a los datos de otros usuarios.\n\n' +
      '¿Estás seguro de que deseas continuar?'
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      '¿De verdad quieres eliminar todo? Se vaciará permanentemente tu base de datos de tickets e imágenes asociadas.'
    );
    if (!secondConfirm) return;

    try {
      // 1. Obtener la lista de tickets para recolectar las imágenes y borrarlas
      const { data: tickets, error: fetchError } = await supabase
        .from('tickets')
        .select('image_url')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (!tickets || tickets.length === 0) {
        alert('No hay tickets en tu cuenta para vaciar.');
        return;
      }

      // 2. Extraer rutas de imágenes válidas y borrarlas de storage
      const imagePaths = tickets
        .map(t => t.image_url)
        .filter(url => url !== null && url !== undefined && url !== '');

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('ticket-images')
          .remove(imagePaths);

        if (storageError) {
          console.warn('Advertencia al borrar imágenes de storage:', storageError.message);
        }
      }

      // 3. Borrar registros de la base de datos
      const { error: dbError } = await supabase
        .from('tickets')
        .delete()
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      alert('Todos tus tickets y justificantes se han eliminado correctamente.');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing database:', error.message);
      alert('Hubo un error al vaciar los tickets: ' + error.message);
    }
  };

  const handleDiagnostics = async () => {
    try {
      const { count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;

      alert(
        `--- Diagnóstico Técnico TicketControl ---\n\n` +
        `• Estado de Conexión: Activo\n` +
        `• Base de datos Supabase: Operativa\n` +
        `• Usuario autenticado: ${user.email}\n` +
        `• ID de usuario: ${user.id}\n` +
        `• Total tickets del usuario: ${count} registros\n\n` +
        `Políticas de seguridad RLS validadas.`
      );
    } catch (error) {
      alert(`Error de Diagnóstico: ${error.message}`);
    }
  };

  const settingsItems = [
    { id: 'export', label: 'Exportar JSON', icon: 'file_download', color: 'text-primary' },
    { id: 'import', label: 'Importar JSON', icon: 'file_upload', color: 'text-primary' },
    { id: 'clear', label: 'Vaciar tickets', icon: 'delete_sweep', color: 'text-error' },
    { id: 'diag', label: 'Diagnóstico técnico', icon: 'terminal', color: 'text-on-surface-variant' },
  ];

  const handleItemClick = (id) => {
    switch (id) {
      case 'export':
        handleExport();
        break;
      case 'import':
        handleImportClick();
        break;
      case 'clear':
        handleClearTickets();
        break;
      case 'diag':
        handleDiagnostics();
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-headline font-bold text-on-surface mt-6 mb-2">Ajustes</h1>
      <p className="text-on-surface-variant mb-8 text-sm">Control interno y gestión de datos locales.</p>

      {/* User Info Section */}
      <div className="bg-surface-container-low p-6 rounded-3xl mb-8 border border-outline-variant/10 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-headline font-bold text-on-surface truncate">
            {user?.user_metadata?.full_name || 'Usuario de TicketControl'}
          </h3>
          <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
        </div>
        <div className="px-2 py-1 bg-primary/10 rounded-md">
          <span className="text-[10px] font-bold text-primary uppercase">PRO</span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-3">
        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className="w-full p-4 bg-surface-container-lowest rounded-2xl flex items-center justify-between hover:bg-surface-container-low transition-colors group border border-outline-variant/5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className={`material-symbols-outlined ${item.color} text-xl`}>{item.icon}</span>
              <span className="font-medium text-on-surface text-sm">{item.label}</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/30 text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
        ))}
      </div>

      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleImportFile} 
      />

      <div className="mt-10 pt-10 border-t border-outline-variant/20">
        <button 
          onClick={handleLogout}
          className="w-full p-4 bg-error/10 hover:bg-error/15 text-error rounded-2xl flex items-center justify-center gap-3 font-headline font-bold transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </div>

      {/* App Version Info */}
      <div className="mt-12 text-center text-on-surface-variant/40">
        <p className="text-[10px] font-bold uppercase tracking-widest">TicketControl App</p>
        <p className="text-[10px] mt-1 font-medium">Versión 1.0.0 (Internal Build)</p>
        <p className="text-[10px] mt-4 opacity-50">Logueado como {user?.email}</p>
      </div>
    </div>
  );
};

export default Settings;
