import React, { useState, useEffect } from 'react';
import { 
  Settings, User as UserIcon, Bell, Shield, 
  Database, Palette, Moon, Sun, Lock, 
  Save, ShieldCheck, Download, Trash2, ChevronDown, ChevronUp, Loader2, Mail, Key
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const ConfiguracionPage = () => {
  const { user, token } = useAuthStore();
  const [expandedSection, setExpandedSection] = useState('perfil');
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  
  const [profileForm, setProfileForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    password: ''
  });

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        nombre: user.nombre || '',
        email: user.email || '',
        password: ''
      });
    }
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const applyColorTheme = (color) => {
    const primary = color;
    const accent = color + 'CC'; // 80% opacity
    const soft = color + '1A'; // 10% opacity
    
    document.documentElement.style.setProperty('--theme-primary', primary);
    document.documentElement.style.setProperty('--theme-accent', accent);
    document.documentElement.style.setProperty('--theme-soft', soft);
    
    localStorage.setItem('theme-color', JSON.stringify({ primary, accent, soft }));
    toast.success('Esquema de colores aplicado');
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.patch('/auth/perfil', data),
    onSuccess: () => {
      toast.success('Perfil actualizado. Inicia sesión de nuevo para ver los cambios globales.');
    },
    onError: () => toast.error('Error al actualizar el perfil')
  });

  const backupMutation = useMutation({
    mutationFn: () => api.post('/admin/backup'),
    onSuccess: (res) => toast.success(`${res.data.message}: ${res.data.filename}`),
    onError: () => toast.error('Error al generar respaldo')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/auth/users');
      return data;
    },
    enabled: expandedSection === 'seguridad' && user?.rol === 'admin'
  });

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    { id: 'perfil', title: 'Mi Perfil', icon: UserIcon, description: 'Gestiona tu información personal y contraseña.', color: 'bg-blue-50 text-blue-600', darkColor: 'dark:bg-blue-900/20 dark:text-blue-400' },
    { id: 'apariencia', title: 'Apariencia', icon: Palette, description: 'Personaliza colores y modo oscuro.', color: 'bg-pink-50 text-pink-600', darkColor: 'dark:bg-pink-900/20 dark:text-pink-400' },
    { id: 'notificaciones', title: 'Notificaciones', icon: Bell, description: 'Configura alertas de stock y ventas.', color: 'bg-orange-50 text-orange-600', darkColor: 'dark:bg-orange-900/20 dark:text-orange-400' },
    { id: 'seguridad', title: 'Seguridad y Roles', icon: Shield, description: 'Permisos de usuario y gestión de accesos.', color: 'bg-green-50 text-green-600', darkColor: 'dark:bg-green-900/20 dark:text-green-400' },
    { id: 'database', title: 'Base de Datos', icon: Database, description: 'Respaldos y mantenimiento del sistema.', color: 'bg-purple-50 text-purple-600', darkColor: 'dark:bg-purple-900/20 dark:text-purple-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-apple-lg">
            <Settings className="text-brand-primary" size={28} />
          </div>
          Configuración
        </h2>
        <p className="text-text-muted text-sm font-medium">Personaliza el funcionamiento de Dulce Control a tu medida.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="card-apple sticky top-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-24 h-24 rounded-full bg-brand-soft flex items-center justify-center text-brand-primary text-4xl font-black mb-4 border-4 border-white dark:border-gray-800 shadow-shadow-md">
                {user?.nombre?.charAt(0) || '?'}
              </div>
              <h3 className="text-xl font-bold text-text-primary">{user?.nombre || 'Cargando...'}</h3>
              <span className="text-xs font-black text-brand-primary uppercase tracking-widest mt-2 bg-brand-soft px-4 py-1.5 rounded-full border border-brand-accent/20">
                {user?.rol || '...'}
              </span>
              
              <div className="w-full mt-8 space-y-3 text-left">
                 <div className="flex justify-between items-center p-4 bg-bg-primary dark:bg-bg-dark rounded-apple-xl border border-border">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Estado</span>
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Activo
                    </span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-bg-primary dark:bg-bg-dark rounded-apple-xl border border-border">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Seguridad</span>
                    <span className="text-xs font-bold text-text-primary font-mono">JWT 256-AES</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            
            return (
              <div key={section.id} className={`bg-white dark:bg-[#1C1C1E] rounded-[32px] border transition-all duration-300 overflow-hidden ${
                isExpanded ? 'border-brand-primary ring-4 ring-brand-soft/30 shadow-shadow-lg' : 'border-border shadow-sm hover:border-brand-accent/50'
              }`}>
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center gap-6 text-left"
                >
                  <div className={`w-14 h-14 ${section.color} ${section.darkColor} rounded-2xl flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'scale-110 rotate-3' : ''}`}>
                    <Icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-text-primary text-lg tracking-tight">{section.title}</h4>
                    <p className="text-xs text-text-secondary font-medium">{section.description}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full bg-bg-primary dark:bg-bg-dark flex items-center justify-center text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-primary' : ''}`}>
                     <ChevronDown size={20} />
                  </div>
                </button>

                <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 pb-8 px-8' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                   <div className="pt-4 border-t border-border mt-2">
                      
                      {section.id === 'perfil' && (
                        <form className="space-y-6 animate-in slide-in-from-top-4 duration-500" onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Nombre Completo</label>
                              <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input 
                                  type="text" 
                                  className="input-pastel w-full h-14 pl-12"
                                  value={profileForm.nombre}
                                  onChange={(e) => setProfileForm({...profileForm, nombre: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Correo Electrónico</label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input 
                                  type="email" 
                                  className="input-pastel w-full h-14 pl-12"
                                  value={profileForm.email}
                                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Nueva Contraseña</label>
                            <div className="relative">
                              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                              <input 
                                type="password" 
                                className="input-pastel w-full h-14 pl-12"
                                placeholder="••••••••"
                                value={profileForm.password}
                                onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
                              />
                            </div>
                          </div>
                          <button type="submit" disabled={updateProfileMutation.isPending} className="w-full btn-primary h-14 text-lg flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/20">
                            {updateProfileMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Guardar Cambios
                          </button>
                        </form>
                      )}

                      {section.id === 'apariencia' && (
                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center justify-between p-6 bg-bg-primary dark:bg-bg-dark rounded-[24px] border border-border">
                            <div>
                              <h4 className="font-bold text-text-primary">Modo Oscuro</h4>
                              <p className="text-xs text-text-secondary">Interfaz optimizada para la noche.</p>
                            </div>
                            <button 
                              onClick={toggleDarkMode}
                              className={`w-16 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${darkMode ? 'bg-brand-primary justify-end' : 'bg-gray-200 dark:bg-gray-700 justify-start'}`}
                            >
                              <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                                {darkMode ? <Moon size={12} className="text-brand-primary" /> : <Sun size={12} className="text-yellow-500" />}
                              </div>
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-bold text-text-primary px-1">Esquema de Colores</h4>
                            <div className="grid grid-cols-4 gap-4">
                               {[
                                 { name: 'Naranja', color: '#E67E43' },
                                 { name: 'Azul', color: '#2C3E50' },
                                 { name: 'Verde', color: '#27AE60' },
                                 { name: 'Púrpura', color: '#8E44AD' },
                                 { name: 'Rojo', color: '#E74C3C' },
                                 { name: 'Rosa', color: '#F06292' },
                                 { name: 'Cian', color: '#00ACC1' },
                                 { name: 'Gris', color: '#455A64' }
                               ].map(item => (
                                 <button key={item.color} onClick={() => applyColorTheme(item.color)} className="group flex flex-col items-center gap-2">
                                    <div className="h-16 w-full rounded-2xl border-4 border-transparent hover:border-brand-primary transition-all flex items-center justify-center shadow-sm overflow-hidden" style={{ backgroundColor: item.color + '20' }}>
                                       <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-text-muted">{item.name}</span>
                                 </button>
                               ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {section.id === 'seguridad' && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                          {user?.rol !== 'admin' ? (
                            <div className="text-center py-10 bg-bg-primary dark:bg-bg-dark rounded-apple-xl border border-dashed border-border">
                               <ShieldCheck size={48} className="mx-auto text-brand-primary opacity-20 mb-4" />
                               <p className="text-text-muted font-bold">Solo Administradores</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {users.map(u => (
                                <div key={u.id} className="p-4 bg-bg-primary dark:bg-bg-dark rounded-apple-xl border border-border flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center font-black text-brand-primary border border-border shadow-sm">{u.nombre.charAt(0)}</div>
                                    <div>
                                      <p className="text-sm font-bold text-text-primary">{u.nombre}</p>
                                      <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">{u.rol}</p>
                                    </div>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${u.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {section.id === 'database' && (
                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                          <div className="p-8 bg-purple-50 dark:bg-purple-900/10 rounded-[28px] border border-purple-100 dark:border-purple-800 flex flex-col items-center text-center">
                            <Database size={32} className="text-purple-600 mb-4" />
                            <h4 className="font-bold text-purple-900 dark:text-purple-400">Backup SQL</h4>
                            <p className="text-xs text-purple-700/70 dark:text-purple-400/60 mt-2 max-w-xs font-medium">Copia de seguridad completa de la base de datos.</p>
                            <button onClick={() => backupMutation.mutate()} disabled={backupMutation.isPending || user?.rol !== 'admin'} className="mt-8 px-10 py-4 bg-purple-600 text-white font-black text-sm rounded-apple-xl flex items-center gap-3 hover:bg-purple-700 transition-all disabled:opacity-50">
                              {backupMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                              DESCARGAR BACKUP
                            </button>
                          </div>
                        </div>
                      )}

                      {section.id === 'notificaciones' && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                          {['Stock Bajo', 'Cierre Diario', 'Ventas Externas'].map((title, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-bg-primary dark:bg-bg-dark rounded-apple-xl border border-border">
                              <h4 className="text-sm font-bold text-text-primary">{title}</h4>
                              <div className="w-12 h-6 bg-brand-primary rounded-full p-1 flex items-center justify-end cursor-pointer"><div className="w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
