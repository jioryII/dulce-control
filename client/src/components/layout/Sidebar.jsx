import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Tags,
  LayoutDashboard, 
  Package, 
  Truck, 
  ShoppingCart, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, setLogout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Producción', icon: ClipboardList, path: '/produccion' },
    { name: 'Ventas', icon: ShoppingCart, path: '/ventas' },
    { name: 'Stock', icon: Package, path: '/stock' },
    { name: 'Liquidación', icon: Tags, path: '/liquidacion' },
    { name: 'Productos', icon: Tags, path: '/productos' },
    { name: 'Vehículos', icon: Truck, path: '/vehiculos' },
    { name: 'Clientes', icon: Users, path: '/clientes' },
    { name: 'Reportes', icon: BarChart3, path: '/reportes' },
    { name: 'Configuración', icon: Settings, path: '/configuracion' },
  ];

  const handleLogout = () => {
    setLogout();
    navigate('/login');
  };

  return (
    <aside 
      className={`bg-white dark:bg-[#1C1C1E] h-screen transition-all duration-500 flex flex-col fixed left-0 top-0 z-50 border-r border-border ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-4 border-b border-border h-20">
        <div className="min-w-[40px] w-10 h-10 bg-brand-soft rounded-apple-lg flex items-center justify-center shadow-sm overflow-hidden border border-brand-accent/20">
           <img src="/multimedia/dulce-logo2_.png" alt="D" className="w-8 h-8 object-contain" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col truncate animate-in fade-in duration-500">
            <span className="text-text-primary font-black text-lg tracking-tighter leading-none">Dulce Control</span>
            <span className="text-[10px] text-brand-primary font-bold uppercase tracking-[0.2em] mt-1">Bakery OS</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-3 scrollbar-hide">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-apple-lg transition-all relative group ${
              location.pathname === item.path 
                ? 'bg-brand-soft text-brand-primary shadow-sm' 
                : 'text-text-secondary hover:bg-bg-primary hover:text-brand-primary'
            }`}
          >
            <item.icon size={22} className="min-w-[22px]" />
            {!isCollapsed && <span className="text-sm font-bold tracking-tight">{item.name}</span>}
            
            {/* Active indicator bar */}
            {location.pathname === item.path && (
               <div className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full" />
            )}

            {isCollapsed && (
               <div className="absolute left-20 bg-white dark:bg-[#2C2C2E] text-text-primary px-3 py-2 rounded-apple-md text-xs font-bold invisible group-hover:visible whitespace-nowrap z-50 shadow-xl border border-border animate-in slide-in-from-left-2 duration-200">
                 {item.name}
               </div>
            )}
          </Link>
        ))}
      </nav>

      {/* User Area & Toggle */}
      <div className="p-3 border-t border-border bg-bg-primary/50">
        {!isCollapsed && (
          <div className="px-4 py-4 flex items-center gap-3 mb-4 bg-white dark:bg-[#2C2C2E] rounded-apple-xl border border-border shadow-sm">
            <div className="w-10 h-10 rounded-apple-lg bg-brand-soft flex items-center justify-center text-brand-primary border border-brand-accent/20 shadow-inner">
               <span className="text-lg font-black">{user?.nombre?.charAt(0) || '?'}</span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-text-primary text-xs font-black truncate">{user?.nombre || 'Cargando...'}</span>
              <div className="flex items-center gap-1.6">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                 <span className="text-text-muted text-[9px] font-bold uppercase tracking-widest">{user?.rol || '...'}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center p-3 text-text-muted hover:bg-bg-primary hover:text-brand-primary rounded-apple-lg transition-all border border-transparent hover:border-border"
            >
              {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-apple-lg transition-all border border-transparent hover:border-red-100"
              title="Cerrar Sesión"
            >
              <LogOut size={22} />
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
