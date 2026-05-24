import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Tags, 
  Truck, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  X 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const SECONDARY_ITEMS = [
  { name: 'Liquidación',  icon: Tags,       path: '/liquidacion' },
  { name: 'Productos',    icon: Tags,       path: '/productos' },
  { name: 'Vehículos',    icon: Truck,      path: '/vehiculos' },
  { name: 'Clientes',     icon: Users,      path: '/clientes' },
  { name: 'Reportes',     icon: BarChart3,  path: '/reportes' },
  { name: 'Configuración', icon: Settings,   path: '/configuracion' },
];

export const MoreMenuSheet = ({ isOpen, onClose }) => {
  const { user, setLogout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    setLogout();
    navigate('/login');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-[1999] animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1C1C1E] z-[2000] rounded-t-[32px] p-6 pb-[calc(24px+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-border`}>
        <div className="w-12 h-1.5 bg-border dark:bg-[#3A3A3C] rounded-full mx-auto mb-6" />
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-apple-lg bg-brand-soft flex items-center justify-center text-brand-primary font-black border border-brand-accent/20">
              {user?.nombre?.charAt(0) || '?'}
            </div>
            <div className="flex flex-col">
              <span className="text-text-primary font-black text-lg tracking-tight">{user?.nombre || 'Usuario'}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">{user?.rol || 'Rol'}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-bg-primary dark:bg-bg-dark rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-3">
          {SECONDARY_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 p-4 rounded-apple-xl border transition-all ${
                isActive 
                  ? 'bg-brand-soft border-brand-accent/20 text-brand-primary' 
                  : 'bg-bg-primary dark:bg-bg-dark border-transparent text-text-secondary hover:border-border'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-bold tracking-tight">{item.name}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="col-span-2 flex items-center justify-center gap-3 p-4 mt-2 rounded-apple-xl bg-red-50 dark:bg-red-900/10 text-red-500 font-bold border border-transparent active:scale-95 transition-all"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default MoreMenuSheet;
