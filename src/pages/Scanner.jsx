import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/imageCompressor';

const Scanner = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [establishment, setEstablishment] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [ticketReference, setTicketReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const getCategoryLabel = () => {
    switch(category) {
      case 'supermarket': return 'Supermercado';
      case 'restaurant': return 'Restaurante';
      case 'others': return 'Varios';
      default: return 'Ticket';
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Str = reader.result.split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAutoRead = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona o haz una foto de un ticket primero.');
      return;
    }

    setReading(true);
    try {
      const base64Data = await fileToBase64(selectedFile);
      const mimeType = selectedFile.type || 'image/jpeg';

      console.log('Llamando a proxy seguro de Vercel...');
      const response = await fetch('/api/read-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Error en el servidor proxy.');
      }
      
      const resultData = await response.json();

      if (resultData) {
        if (resultData.establishment) setEstablishment(resultData.establishment);
        if (resultData.total_amount) setAmount(resultData.total_amount.toString());
        if (resultData.ticket_date) setDate(resultData.ticket_date);
        if (resultData.ticket_reference) {
          setTicketReference(resultData.ticket_reference);
        } else {
          setTicketReference('');
        }
        
        // Guardar items detectados
        setDetectedItems(Array.isArray(resultData.items) ? resultData.items : []);
        
        alert('Lectura del ticket completada con éxito. Revisa los datos y edita los artículos si es necesario antes de guardar.');
      }
    } catch (error) {
      console.error('Error in ticket auto-read:', error);
      alert('No se pudo leer el ticket de forma automática. Por favor, rellena los datos manualmente.');
    } finally {
      setReading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompressing(true);
      try {
        console.log('Comprimiendo imagen al seleccionar...');
        const compressedBlob = await compressImage(file, 1200, 1200, 0.8);
        const compressedFile = new File([compressedBlob], file.name || 'ticket.jpg', {
          type: 'image/jpeg'
        });
        
        setSelectedFile(compressedFile);
        const url = URL.createObjectURL(compressedFile);
        setPreview(url);
      } catch (error) {
        console.error('Error al comprimir la imagen:', error);
        // Fallback a la imagen original en caso de error
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
      } finally {
        setCompressing(false);
      }

      // Limpiar formulario al cargar nueva imagen
      setEstablishment('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setTicketReference('');
      setNotes('');
      setDetectedItems([]);
    }
  };

  const handleCapture = () => cameraInputRef.current.click();
  const handleUpload = () => fileInputRef.current.click();

  // Handlers para la edición interactiva de productos detectados
  const handleItemChange = (index, field, value) => {
    setDetectedItems(prev => {
      const updated = [...prev];
      let parsedValue = value;
      if (value === '') {
        parsedValue = null;
      } else if (field === 'quantity' || field === 'unit_price' || field === 'total_price') {
        parsedValue = parseFloat(value);
      }
      updated[index] = {
        ...updated[index],
        [field]: parsedValue
      };
      return updated;
    });
  };

  const handleDeleteItem = (index) => {
    setDetectedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddItem = () => {
    setDetectedItems(prev => [
      ...prev,
      { name: '', quantity: 1, unit_price: null, total_price: null, category: 'otros' }
    ]);
  };

  const handleSave = async () => {
    if (!establishment || !amount || !date) {
      alert('Por favor, rellena todos los campos obligatorios (Establecimiento, Importe y Fecha).');
      return;
    }

    if (!selectedFile) {
      alert('Por favor, selecciona o haz una foto de un ticket.');
      return;
    }

    setSaving(true);
    try {
      // Prevención de duplicados mejorada con normalización
      const normalizeText = (text) => {
        if (!text) return '';
        return text.toLowerCase().replace(/[^a-z0-9]/g, '');
      };

      const normalizedInputEst = normalizeText(establishment);
      const numericAmount = parseFloat(amount);
      let isDuplicate = false;

      // Consultar posibles coincidencias por usuario, fecha e importe exacto
      const { data: matches, error: matchError } = await supabase
        .from('tickets')
        .select('id, establishment, ticket_reference')
        .eq('user_id', user.id)
        .eq('ticket_date', date)
        .eq('total_amount', numericAmount);

      if (!matchError && matches && matches.length > 0) {
        const normalizedInputRef = normalizeText(ticketReference);
        
        if (normalizedInputRef) {
          isDuplicate = matches.some(dbTicket => 
            normalizeText(dbTicket.ticket_reference) === normalizedInputRef
          );
        } else {
          isDuplicate = matches.some(dbTicket => {
            const dbEst = normalizeText(dbTicket.establishment);
            return dbEst.includes(normalizedInputEst) || normalizedInputEst.includes(dbEst);
          });
        }
      }

      if (isDuplicate) {
        const proceed = window.confirm('Posible ticket duplicado. Revisa si lo estás duplicando.\n\n¿Deseas guardarlo de todas formas?');
        if (!proceed) {
          setSaving(false);
          return;
        }
      }

      // 1. Subir la imagen comprimida a Supabase Storage
      const fileExt = 'jpg'; // Siempre es JPEG tras la compresión
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-images')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error('Error de Storage: ' + uploadError.message);
      }

      // 2. Guardar el registro en la tabla de tickets
      const { data: savedTicket, error: dbError } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          ticket_type: category,
          establishment: establishment.trim(),
          ticket_date: date,
          total_amount: parseFloat(amount),
          image_url: filePath,
          ticket_reference: ticketReference.trim() || null,
          notes: notes.trim() || null
        })
        .select()
        .single();

      if (dbError) {
        // Borrar imagen huérfana de storage si falla la BD
        await supabase.storage.from('ticket-images').remove([filePath]);
        throw new Error('Error de BD: ' + dbError.message);
      }

      // 3. Guardar items modificados y editados por el usuario
      if (savedTicket && detectedItems && detectedItems.length > 0) {
        const itemsPayload = detectedItems
          .filter(item => (item.name || item.item_name)?.trim()) // Ignorar artículos sin nombre
          .map((item, index) => ({
            ticket_id:   savedTicket.id,
            user_id:     user.id,
            item_name:   (item.name || item.item_name).trim(),
            quantity:    item.quantity   ?? null,
            unit_price:  item.unit_price ?? null,
            total_price: item.total_price ?? null,
            category:    item.category   ?? null, // Guardar la categoría del producto
            raw_line:    item.raw_line   ?? null,
            line_order:  index,
          }));

        if (itemsPayload.length > 0) {
          const { error: itemsError } = await supabase
            .from('ticket_items')
            .insert(itemsPayload);

          if (itemsError) {
            console.warn('[ticket_items] Guardado parcial de items fallido:', itemsError.message);
          }
        }
      }

      alert('Ticket guardado correctamente.');
      navigate(`/tickets/list/${category}`);
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('No se pudo guardar el ticket: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-500 max-w-md mx-auto w-full">
      {/* Header Info */}
      <div className="w-full text-center mt-4 mb-6">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-full">Captura de Ticket</span>
        <h1 className="text-2xl font-headline font-bold text-on-surface mt-2">{getCategoryLabel()}</h1>
      </div>

      {/* Image Preview Area */}
      <div className="w-full max-w-sm aspect-[3/4] bg-surface-container rounded-[2.5rem] overflow-hidden flex items-center justify-center border-2 border-dashed border-outline-variant relative group shadow-sm">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
        ) : compressing ? (
          <div className="flex flex-col items-center gap-4 text-primary">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-center px-12">Optimizando imagen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-7xl">image_search</span>
            <p className="text-sm font-medium px-12 text-center">No hay ninguna imagen seleccionada</p>
          </div>
        )}
        
        {preview && !saving && (
          <button 
            onClick={() => {
              setPreview(null);
              setSelectedFile(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Inputs Form if Preview exists */}
      {preview && (
        <div className="w-full max-w-sm mt-6 p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col gap-4">
          
          <button
            type="button"
            disabled={reading || saving || compressing}
            onClick={handleAutoRead}
            className={`w-full h-12 rounded-xl font-headline font-bold flex items-center justify-center gap-3 shadow-sm border active:scale-95 transition-all mb-2 ${
              reading 
                ? 'bg-primary/5 text-primary/40 border-primary/10 cursor-not-allowed'
                : 'bg-primary/10 hover:bg-primary/15 text-primary border-primary/20'
            }`}
          >
            {reading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Leyendo ticket...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">psychology</span>
                Leer ticket automáticamente
              </>
            )}
          </button>

          <h3 className="font-headline font-bold text-on-surface text-lg border-b border-outline-variant/10 pb-2">Detalles del Ticket</h3>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Establecimiento</label>
            <input 
              type="text" 
              required
              disabled={saving}
              placeholder="Ej. Mercadona, Repsol..." 
              value={establishment}
              onChange={(e) => setEstablishment(e.target.value)}
              className="h-12 px-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Importe Total (€)</label>
            <input 
              type="number" 
              step="0.01"
              required
              disabled={saving}
              placeholder="Ej. 45.20" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 px-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha</label>
            <input 
              type="date" 
              required
              disabled={saving}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 px-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nº ticket / referencia</label>
            <input 
              type="text" 
              disabled={saving}
              placeholder="Ej. T-1029, 0432-88..." 
              value={ticketReference}
              onChange={(e) => setTicketReference(e.target.value)}
              className="h-12 px-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Notas (Opcional)</label>
            <textarea 
              disabled={saving}
              placeholder="Añade algún comentario..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:outline-none transition-colors resize-none disabled:opacity-50"
            />
          </div>
          
          {/* Sección Productos Detectados — Edición Interactiva */}
          {detectedItems !== undefined && (
            <div className="w-full mt-4 p-4 bg-surface-container rounded-2xl border border-outline-variant/10 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                <span className="material-symbols-outlined text-primary text-lg">list_alt</span>
                <h3 className="font-headline font-bold text-on-surface text-sm">Productos detectados</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="ml-auto flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined text-[12px]">add</span> Añadir
                </button>
              </div>

              {detectedItems.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-2">No se han detectado productos en este ticket.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {detectedItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/10 relative">
                      {/* Fila 1: Nombre del producto e ícono borrar */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.name || item.item_name || ''}
                          placeholder="Nombre del artículo"
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="flex-1 h-8 px-2 rounded-md border border-outline-variant/20 bg-surface-container-low text-on-surface text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-error hover:bg-error/10 active:scale-95 transition-all"
                          title="Eliminar artículo"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>

                      {/* Fila 2: Cantidad, P. Unitario, Total y Categoría */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">Cant</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="h-7 px-1 rounded-md border border-outline-variant/20 bg-surface-container-low text-on-surface text-xs focus:border-primary focus:outline-none text-center"
                          />
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">P. Unit (€)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price !== null && item.unit_price !== undefined ? item.unit_price : ''}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="h-7 px-1 rounded-md border border-outline-variant/20 bg-surface-container-low text-on-surface text-xs focus:border-primary focus:outline-none text-center"
                          />
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">Total (€)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.total_price !== null && item.total_price !== undefined ? item.total_price : ''}
                            onChange={(e) => handleItemChange(idx, 'total_price', e.target.value)}
                            className="h-7 px-1 rounded-md border border-outline-variant/20 bg-surface-container-low text-on-surface text-xs focus:border-primary focus:outline-none text-center font-bold"
                          />
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">Familia</span>
                          <select
                            value={item.category || 'otros'}
                            onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                            className="h-7 px-1 rounded-md border border-outline-variant/20 bg-surface-container-low text-on-surface text-[10px] focus:border-primary focus:outline-none capitalize"
                          >
                            <option value="comida">Comida</option>
                            <option value="bebida">Bebida</option>
                            <option value="limpieza">Limpieza</option>
                            <option value="hogar">Hogar</option>
                            <option value="otros">Otros</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-sm mt-6 flex flex-col gap-4">
        {!preview ? (
          <>
            <button 
              disabled={compressing}
              onClick={handleCapture}
              className="btn-primary w-full"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              Hacer foto
            </button>
            
            <button 
              disabled={compressing}
              onClick={handleUpload}
              className="btn-secondary w-full"
            >
              <span className="material-symbols-outlined">upload_file</span>
              Subir foto
            </button>
          </>
        ) : (
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`w-full h-14 rounded-xl font-headline font-bold flex items-center justify-center gap-4 shadow-lg active:scale-95 transition-all text-white ${
              saving ? 'bg-secondary-container/50 text-secondary cursor-not-allowed' : 'bg-secondary hover:bg-secondary/90'
            }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Guardando ticket...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                Guardar Ticket
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden Inputs */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />

      <p className="text-xs text-on-surface-variant/60 text-center mt-8 px-10">
        Una vez capturada la imagen, podrás rellenar los datos de tu ticket para guardarlo en la categoría de {getCategoryLabel()}.
      </p>
    </div>
  );
};

export default Scanner;
