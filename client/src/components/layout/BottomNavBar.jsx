import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ClipboardList, 
  Package, 
  MoreHorizontal 
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Inicio',     icon: LayoutDashboard, path: '/' },
  { label: 'Ventas',     icon: ShoppingCart,    path: '/ventas' },
  { label: 'Producción', icon: ClipboardList,   path: '/produccion' },
  { label: 'Stock',      icon: Package,         path: '/stock' },
];

export const BottomNavBar = ({ onOpenMore }) => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#1C1C1E] border-t border-border flex z-[1000] pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive ? 'text-brand-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <item.icon size={22} />
          <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
        </NavLink>
      ))}
      <button
        onClick={onOpenMore}
        className="flex-1 flex flex-col items-center justify-center gap-1 text-text-muted hover:text-text-secondary transition-colors"
      >
        <MoreHorizontal size={22} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Más</span>
      </button>
    </nav>
  );
};

export default BottomNavBar;
