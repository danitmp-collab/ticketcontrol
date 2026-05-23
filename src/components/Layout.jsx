import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background font-body">
      {/* TopAppBar */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-50 bg-surface/80 backdrop-blur-md h-14 flex justify-between items-center px-5 shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <span className="text-lg font-headline font-bold text-primary">TicketControl</span>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-all active:scale-95">
          <span className="material-symbols-outlined text-primary">account_circle</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-24 w-full max-w-[600px] mx-auto px-5 flex flex-col min-h-screen">
        {children}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-50 bg-surface dark:bg-on-background shadow-[0_-4px_12px_rgba(0,0,0,0.04)] flex justify-around items-center px-4 py-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${isActive ? 'text-primary' : 'text-on-surface-variant opacity-70'}`
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-xs font-semibold">Inicio</span>
        </NavLink>

        <NavLink 
          to="/tickets" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${isActive ? 'text-primary' : 'text-on-surface-variant opacity-70'}`
          }
        >
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-xs font-semibold">Tickets</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${isActive ? 'text-primary' : 'text-on-surface-variant opacity-70'}`
          }
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-xs font-semibold">Ajustes</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
