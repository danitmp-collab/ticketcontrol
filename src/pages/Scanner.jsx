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
  const [saving, setSaving] = useState(false);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
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
