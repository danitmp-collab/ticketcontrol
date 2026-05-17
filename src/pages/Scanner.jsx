import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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

      let resultData = null;

      // Doble seguridad para invocación de API
      const localApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (localApiKey) {
        console.log('Utilizando clave API local (Gemini Direct-Call)...');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Data } },
                { text: "Analiza la imagen de este ticket de compra o recibo y extrae la siguiente información estructurada de forma extremadamente precisa:\n- establishment: Nombre del comercio o establecimiento comercial principal (ej: Mercadona, DIA, Carrefour, Restaurante El Paso).\n- total_amount: El importe total final cobrado a pagar como número decimal (ej. 15.42). Omitir subtotales u otros importes.\n- ticket_date: La fecha de emisión del ticket en formato AAAA-MM-DD. Si solo viene el año abreviado, conviértelo (ej. 23 -> 2023).\n- ticket_reference: El número de ticket, número de operación, número de referencia o factura de compra si existe de forma clara. Si no existe o no es identificable, dejar en blanco (cadena vacía).\n- items: Lista de todos los artículos, productos o consumiciones del ticket. Para cada línea individual extrae:\n  * name: nombre del producto o plato (obligatorio).\n  * quantity: cantidad numérica si aparece explícitamente. Si no aparece, omite este campo.\n  * unit_price: precio unitario si aparece. Si no aparece, omite este campo.\n  * total_price: precio total de esa línea si aparece. Si no aparece, omite este campo.\n  * category: clasifica como 'comida', 'bebida', 'limpieza', 'hogar' u 'otros'. Si no se puede clasificar, omite este campo.\n  Ignora líneas de descuento global, IVA, subtotales y totales. Si el ticket no muestra detalle de artículos, devuelve items como array vacío []." }
              ]
            }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  establishment: { type: "string" },
                  total_amount: { type: "number" },
                  ticket_date: { type: "string" },
                  ticket_reference: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name:        { type: "string" },
                        quantity:    { type: "number" },
                        unit_price:  { type: "number" },
                        total_price: { type: "number" },
                        category:    { type: "string" }
                      },
                      required: ["name"]
                    }
                  }
                },
                required: ["establishment", "total_amount", "ticket_date"]
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error('La llamada local a Gemini falló.');
        }
        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        resultData = JSON.parse(textOutput);
      } else {
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
        resultData = await response.json();
      }

      if (resultData) {
        if (resultData.establishment) setEstablishment(resultData.establishment);
        if (resultData.total_amount) setAmount(resultData.total_amount.toString());
        if (resultData.ticket_date) setDate(resultData.ticket_date);
        if (resultData.ticket_reference) {
          setTicketReference(resultData.ticket_reference);
        } else {
          setTicketReference('');
        }
        // Guardar items detectados para mostrar (Fase 0 — solo lectura, sin persistir)
        setDetectedItems(Array.isArray(resultData.items) ? resultData.items : []);
        
        alert('Lectura del ticket completada con éxito. Revisa los datos y edita si es necesario antes de guardar.');
      }
    } catch (error) {
      console.error('Error in ticket auto-read:', error);
      alert('No se pudo leer el ticket de forma automática. Por favor, rellena los datos manualmente.');
    } finally {
      setReading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      // Reset form on new image
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
      // 0. Prevención de duplicados mejorada con normalización
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
          // NO se debe usar solo ticket_reference como clave única, porque en algunos 
          // restaurantes o TPV la referencia puede repetirse.
          // Consideramos duplicado si coincide: user_id, ticket_reference normalizada, fecha y total_amount exacto.
          // No exigimos coincidencia del establecimiento.
          isDuplicate = matches.some(dbTicket => 
            normalizeText(dbTicket.ticket_reference) === normalizedInputRef
          );
        } else {
          // Si el ticket NO tiene ticket_reference:
          // mantener detección por user_id, establecimiento normalizado/flexible, fecha y total_amount exacto
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

      // 1. Subir la imagen a Supabase Storage en la ruta privada (carpeta con ID de usuario)
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-images')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error('Error de Storage: ' + uploadError.message);
      }

      // 2. Guardar el registro en la tabla de tickets vinculándolo con el user_id
      const { error: dbError } = await supabase
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
        });

      if (dbError) {
        // Si falla la BD, intentamos borrar la imagen huérfana de storage
        await supabase.storage.from('ticket-images').remove([filePath]);
        throw new Error('Error de BD: ' + dbError.message);
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
    <div className="flex flex-col items-center animate-in fade-in duration-500 max-w-md mx-auto">
      {/* Header Info */}
      <div className="w-full text-center mt-4 mb-6">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-full">Captura de Ticket</span>
        <h1 className="text-2xl font-headline font-bold text-on-surface mt-2">{getCategoryLabel()}</h1>
      </div>

      {/* Image Preview Area */}
      <div className="w-full max-w-sm aspect-[3/4] bg-surface-container rounded-[2.5rem] overflow-hidden flex items-center justify-center border-2 border-dashed border-outline-variant relative group shadow-sm">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
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
            disabled={reading || saving}
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
          {/* Sección Productos Detectados — Fase 0: solo lectura */}
          {detectedItems !== undefined && (
            <div className="w-full max-w-sm mt-4 p-5 bg-surface-container-low rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                <span className="material-symbols-outlined text-primary text-lg">list_alt</span>
                <h3 className="font-headline font-bold text-on-surface text-lg">Productos detectados</h3>
                <span className="ml-auto text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full uppercase tracking-wider">Solo lectura</span>
              </div>

              {detectedItems.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-3">No se han detectado productos en este ticket.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {detectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/10">
                      <div className="flex-1 min-w-0">
                        <p className="font-headline font-semibold text-on-surface text-sm truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          {item.quantity != null && (
                            <span className="text-[11px] text-on-surface-variant">Cant: {item.quantity}</span>
                          )}
                          {item.unit_price != null && (
                            <span className="text-[11px] text-on-surface-variant">P.u: {item.unit_price.toFixed(2)}€</span>
                          )}
                          {item.category && (
                            <span className="text-[10px] font-bold text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded-full capitalize">{item.category}</span>
                          )}
                        </div>
                      </div>
                      {item.total_price != null && (
                        <span className="font-headline font-bold text-primary text-sm whitespace-nowrap">{item.total_price.toFixed(2)}€</span>
                      )}
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
              onClick={handleCapture}
              className="btn-primary w-full"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              Hacer foto
            </button>
            
            <button 
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
