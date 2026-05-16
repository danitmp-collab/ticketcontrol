import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Scanner = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
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
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleCapture = () => cameraInputRef.current.click();
  const handleUpload = () => fileInputRef.current.click();

  const handleSave = () => {
    // Aquí irá la lógica de guardado posterior
    alert('Imagen capturada correctamente para ' + getCategoryLabel());
    navigate('/tickets');
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="w-full text-center mt-4 mb-6">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-full">Captura de Ticket</span>
        <h1 className="text-2xl font-headline font-bold text-on-surface mt-2">{getCategoryLabel()}</h1>
      </div>

      {/* Image Preview Area */}
      <div className="w-full max-w-sm aspect-[3/4] bg-surface-container rounded-[2.5rem] overflow-hidden flex items-center justify-center border-2 border-dashed border-outline-variant relative group">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-4 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-7xl">image_search</span>
            <p className="text-sm font-medium px-12 text-center">No hay ninguna imagen seleccionada</p>
          </div>
        )}
        
        {preview && (
          <button 
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full mt-10 flex flex-col gap-4">
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
            className="w-full h-14 bg-secondary text-white rounded-xl font-headline font-bold flex items-center justify-center gap-4 shadow-lg active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">check_circle</span>
            Procesar Ticket
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
        Una vez capturada la imagen, podrás revisarla antes de guardarla en la categoría de {getCategoryLabel()}.
      </p>
    </div>
  );
};

export default Scanner;
