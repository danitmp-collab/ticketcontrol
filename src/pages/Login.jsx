import React from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error logging in:', error.message);
      alert('Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-in fade-in zoom-in duration-700">
      <div className="w-20 h-20 bg-primary rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-white text-4xl">confirmation_number</span>
      </div>
      
      <h1 className="text-4xl font-headline font-extrabold text-on-surface mb-3 tracking-tight">
        TicketControl
      </h1>
      <p className="text-on-surface-variant mb-12 max-w-[280px]">
        Gestiona tus tickets y gastos de forma inteligente en un solo lugar.
      </p>

      <div className="w-full max-w-sm p-8 bg-surface-container-low rounded-[2.5rem] border border-outline-variant/10 shadow-sm">
        <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Bienvenido</h2>
        
        <button 
          onClick={handleLogin}
          className="w-full h-14 bg-white border border-outline-variant flex items-center justify-center gap-4 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all shadow-sm group"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-5 h-5 group-hover:scale-110 transition-transform"
          />
          <span className="text-on-surface font-headline font-bold">Continuar con Google</span>
        </button>

        <p className="text-[10px] text-on-surface-variant/50 mt-8 uppercase tracking-[0.15em] font-bold">
          Herramienta Interna Segura
        </p>
      </div>

      <div className="mt-12 flex flex-col items-center gap-1 text-on-surface-variant/40">
        <p className="text-xs">Al continuar, aceptas nuestras herramientas de gestión</p>
        <p className="text-[10px] font-bold uppercase tracking-widest">v1.0.0</p>
      </div>
    </div>
  );
};

export default Login;
