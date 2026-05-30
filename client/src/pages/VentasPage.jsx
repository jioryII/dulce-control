import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ShoppingCart, Search, Plus, Minus, Trash2, Check, User, Users, X, UserPlus, Phone, MapPin, Loader2, ArrowRight, History, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsMobile } from '../hooks/useIsMobile';

const VentasPage = () => {
  const isMobile = useIsMobile();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('productos'); // 'productos' | 'carrito' | 'historial'
  
  // Discount state
  const [descuentoMonto, setDescuentoMonto] = useState(0);
  const [descuentoMotivo, setDescuentoMotivo] = useState('');

  const [newClient, setNewClient] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    tipo: 'variable'
  });
  
  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data: jornada } = useQuery({
    queryKey: ['jornada-hoy'],
    queryFn: async () => {
      const { data } = await api.get('/jornada/hoy');
      return data;
    }
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data } = await api.get('/productos');
      return data;
    }
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await api.get('/clientes');
      return data;
    }
  });

  const { data: historialJornadas = [], isLoading: isLoadingHistorial } = useQuery({
    queryKey: ['historial-ventas'],
    queryFn: async () => {
      const { data } = await api.get('/jornada/historial');
      return data;
    },
    enabled: activeTab === 'historial'
  });

  const registrarVentaMutation = useMutation({
    mutationFn: (ventaData) => api.post('/ventas', ventaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock-diario'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-mes-actual'] });
      toast.success('Venta realizada con éxito');
      setCart([]);
      setSelectedClientId('');
      setDescuentoMonto(0);
      setDescuentoMotivo('');
      setActiveTab('productos');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al registrar venta');
    }
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData) => api.post('/clientes', clientData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado con éxito');
      setSelectedClientId(response.data.id);
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', telefono: '', direccion: '', tipo: 'variable' });
    },
    onError: () => {
      toast.error('Error al crear el cliente');
    }
  });

  const handleCreateClient = (e) => {
    e.preventDefault();
    createClientMutation.mutate(newClient);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.cantidad : 0;
    
    if (currentQty + 1 > product.stock_actual) {
      return toast.error(`Solo hay ${product.stock_actual} unidades disponibles`);
    }

    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    const productInCart = cart.find(item => item.id === productId);
    const productInStock = productos.find(p => p.id === productId);
    
    if (delta > 0 && productInCart.cantidad + delta > productInStock.stock_actual) {
      return toast.error(`Solo hay ${productInStock.stock_actual} unidades disponibles`);
    }

    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!jornada) return toast.error('Debes abrir la jornada primero');

    const subtotal = calculateSubtotal();
    const descuentoFormateado = Number(descuentoMonto) || 0;
    const total = subtotal - descuentoFormateado;

    if (total < 0) {
      return toast.error('El descuento no puede ser mayor al subtotal');
    }

    if (descuentoFormateado > 0 && !descuentoMotivo) {
      return toast.error('Debes ingresar un motivo para el descuento');
    }

    const ventaData = {
      jornada_id: jornada.id,
      cliente_id: selectedClientId || null,
      subtotal: subtotal,
      descuento: descuentoFormateado,
      descuento_motivo: descuentoFormateado > 0 ? descuentoMotivo : null,
      total: total,
      items: cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unit: item.precio,
        subtotal: item.precio * item.cantidad
      }))
    };

    registrarVentaMutation.mutate(ventaData);
  };

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex gap-2 p-1 bg-white dark:bg-[#1C1C1E] rounded-apple-xl border border-border sticky top-0 z-40">
        <button
          onClick={() => setActiveTab('productos')}
          className={`flex-1 py-3 rounded-apple-lg text-sm font-black transition-all ${
            activeTab === 'productos' ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab('carrito')}
          className={`flex-1 py-3 rounded-apple-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === 'carrito' ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary'
          }`}
        >
          Carrito
          {cart.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'carrito' ? 'bg-white text-brand-primary' : 'bg-brand-soft text-brand-primary'}`}>
              {cart.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-3 rounded-apple-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === 'historial' ? 'bg-brand-primary text-white shadow-md' : 'text-text-secondary'
          }`}
        >
          <History size={16} />
          <span className="hidden md:inline">Historial</span>
        </button>
      </div>

      {activeTab === 'historial' ? (
        <div className="card-apple animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-soft rounded-apple-lg text-brand-primary">
              <History size={24} />
            </div>
            <h3 className="text-xl font-black text-text-primary">Historial de Ventas por Jornada (3 meses)</h3>
          </div>
          
          {isLoadingHistorial ? (
            <div className="py-20 flex justify-center">
               <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted font-bold uppercase text-[10px] tracking-widest">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Ventas Directas</th>
                    <th className="p-4">Ventas Vehículos</th>
                    <th className="p-4 text-brand-primary">Total</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historialJornadas.map(j => {
                     const directas = Number(j.ventas_directas);
                     const vehiculos = Number(j.ventas_vehiculos);
                     return (
                       <tr key={j.id} className="border-b border-border/50 hover:bg-bg-primary/50 transition-colors group">
                         <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                           <Calendar size={14} className="text-text-muted group-hover:text-brand-primary" />
                           {new Date(j.fecha).toLocaleDateString()}
                         </td>
                         <td className="p-4 font-mono">S/ {directas.toFixed(2)}</td>
                         <td className="p-4 font-mono">S/ {vehiculos.toFixed(2)}</td>
                         <td className="p-4 font-mono font-black text-brand-primary">S/ {(directas + vehiculos).toFixed(2)}</td>
                         <td className="p-4">
                           <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             j.estado === 'abierta' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                           }`}>
                             {j.estado}
                           </span>
                         </td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className={`lg:col-span-2 space-y-6 ${(isMobile && activeTab !== 'productos') ? 'hidden' : ''}`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar producto..." 
                  className="input-pastel w-full pl-10 h-12 md:h-10 text-base md:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-80 flex gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <select 
                    className="input-pastel w-full pl-10 h-12 md:h-10 text-base md:text-sm"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">Cliente General</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setIsClientModalOpen(true)}
                  className="w-12 h-12 flex items-center justify-center bg-brand-soft text-brand-primary rounded-apple-lg border border-brand-accent/20 hover:bg-brand-primary hover:text-white transition-all shadow-sm shrink-0"
                  title="Registrar nuevo cliente"
                >
                  <UserPlus size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock_actual <= 0;
                const isLowStock = product.stock_actual > 0 && product.stock_actual <= 5;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`bg-white dark:bg-[#1C1C1E] p-3 md:p-4 rounded-apple-xl border transition-all text-left group relative flex flex-col justify-between min-h-[120px] md:min-h-[auto] ${
                      isOutOfStock 
                        ? 'opacity-60 grayscale cursor-not-allowed border-border' 
                        : 'border-border active:scale-95 md:hover:border-brand-primary md:hover:shadow-shadow-md'
                    }`}
                  >
                    <div>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-apple-lg flex items-center justify-center mb-2 md:mb-3 transition-transform ${
                        isOutOfStock ? 'bg-bg-secondary dark:bg-bg-dark text-text-muted' : 'bg-brand-soft text-brand-primary group-hover:scale-110'
                      }`}>
                        <ShoppingCart size={isMobile ? 16 : 20} />
                      </div>
                      <h4 className="font-bold text-text-primary text-xs md:text-sm line-clamp-2">{product.nombre}</h4>
                    </div>
                    <div className="flex justify-between items-end mt-2 md:mt-1">
                      <p className="text-brand-primary font-mono font-bold text-sm md:text-base">S/ {parseFloat(product.precio).toFixed(2)}</p>
                      
                      {isOutOfStock ? (
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 md:px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/30">
                          Agotado
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 md:px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30">
                          {product.stock_actual} uds
                        </span>
                      ) : (
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 md:px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/30">
                          Stock: {product.stock_actual}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart Summary */}
          <div className={`lg:col-span-1 ${(isMobile && activeTab !== 'carrito') ? 'hidden' : ''}`}>
            <div className={`bg-white dark:bg-[#1C1C1E] md:rounded-[32px] shadow-shadow-lg border border-border overflow-hidden flex flex-col ${
              isMobile ? 'min-h-[60vh]' : 'h-[calc(100vh-200px)] sticky top-8 rounded-[32px]'
            }`}>
              {!isMobile && (
                <div className="p-6 border-b border-border bg-bg-primary/30">
                  <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <ShoppingCart className="text-brand-primary" />
                    Resumen de Venta
                  </h3>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-40 py-12 md:py-0">
                    <ShoppingCart size={isMobile ? 64 : 48} className="mb-4" />
                    <p className="font-bold uppercase text-xs tracking-widest text-center">El carrito está vacío</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 md:gap-4 group animate-in slide-in-from-right-4 duration-300 border-b border-border/50 pb-4 last:border-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-bg-primary dark:bg-bg-dark rounded-apple-lg flex items-center justify-center text-text-primary font-bold border border-border shrink-0">
                      {item.cantidad}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-text-primary text-sm truncate">{item.nombre}</h4>
                      <p className="text-xs text-text-secondary font-mono">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 md:w-7 md:h-7 rounded-full bg-white dark:bg-bg-dark flex items-center justify-center border border-border text-text-primary active:bg-brand-soft active:text-brand-primary transition-all">
                        <Minus size={isMobile ? 18 : 14} />
                      </button>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 md:w-7 md:h-7 rounded-full bg-white dark:bg-bg-dark flex items-center justify-center border border-border text-text-primary active:bg-brand-soft active:text-brand-primary transition-all">
                        <Plus size={isMobile ? 18 : 14} />
                      </button>
                      {!isMobile && (
                        <button onClick={() => removeFromCart(item.id)} className="ml-2 text-text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {isMobile && (
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 active:text-red-600">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className={`p-6 bg-bg-primary/50 dark:bg-bg-dark border-t border-border space-y-4 ${isMobile ? 'pb-10' : ''}`}>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-text-secondary font-medium">
                     <span className="text-sm">Subtotal</span>
                     <span className="font-mono">S/ {calculateSubtotal().toFixed(2)}</span>
                   </div>
                   
                   <div className="flex flex-col gap-2 p-3 bg-white dark:bg-[#1C1C1E] border border-border rounded-apple-lg">
                      <label className="text-[10px] font-black uppercase text-text-muted flex items-center gap-1">
                        <Tag size={12} /> Descuento (S/)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="0"
                          step="0.10"
                          className="input-pastel w-24 h-9 text-sm font-mono"
                          value={descuentoMonto}
                          onChange={(e) => setDescuentoMonto(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Motivo del descuento"
                          className="input-pastel flex-1 h-9 text-sm"
                          value={descuentoMotivo}
                          onChange={(e) => setDescuentoMotivo(e.target.value)}
                        />
                      </div>
                   </div>

                   <div className="flex justify-between items-center text-text-primary text-2xl font-black tracking-tighter pt-2 border-t border-border/50">
                     <span>Total</span>
                     <span className="text-brand-primary font-mono">
                       S/ {Math.max(0, calculateSubtotal() - (Number(descuentoMonto) || 0)).toFixed(2)}
                     </span>
                   </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || registrarVentaMutation.isPending}
                  className="w-full btn-primary h-14 md:h-auto py-4 text-lg font-bold shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3"
                >
                  {registrarVentaMutation.isPending ? <Loader2 className="animate-spin" /> : (
                    <>
                      <Check size={20} />
                      Completar Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for mobile cart */}
      {isMobile && activeTab === 'productos' && cart.length > 0 && (
        <button
          onClick={() => setActiveTab('carrito')}
          className="fixed bottom-24 left-6 right-6 h-14 bg-brand-primary text-white rounded-apple-xl shadow-2xl z-40 flex items-center justify-between px-6 animate-in slide-in-from-bottom-10 duration-500"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
            <span className="font-black text-sm uppercase tracking-widest">Ver Carrito ({cart.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">
               S/ {Math.max(0, calculateSubtotal() - (Number(descuentoMonto) || 0)).toFixed(2)}
            </span>
            <ArrowRight size={20} />
          </div>
        </button>
      )}

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsClientModalOpen(false)} />
          <div className={`bg-white dark:bg-[#1C1C1E] w-full max-w-[420px] rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in ${isMobile ? 'slide-in-from-bottom' : 'zoom-in'} duration-300 border-t md:border border-border flex flex-col max-h-[90vh]`}>
            {isMobile && <div className="w-12 h-1.5 bg-border dark:bg-[#3A3A3C] rounded-full mx-auto mt-4" />}
            
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary">
                    <UserPlus size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary tracking-tight">Nuevo Cliente</h3>
              </div>
              <button onClick={() => setIsClientModalOpen(false)} className="w-10 h-10 bg-bg-primary dark:bg-bg-dark rounded-full flex items-center justify-center text-text-muted">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 md:p-8 space-y-6 overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom))]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text" 
                      required
                      className="input-pastel w-full pl-12 h-12 md:h-10 text-base"
                      placeholder="Ej: Juan Pérez"
                      value={newClient.nombre}
                      onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input 
                        type="tel" 
                        inputMode="tel"
                        className="input-pastel w-full pl-12 h-12 md:h-10 text-base"
                        placeholder="999..."
                        value={newClient.telefono}
                        onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Tipo de Cliente</label>
                    <select 
                      className="input-pastel w-full h-12 md:h-10 text-base appearance-none"
                      value={newClient.tipo}
                      onChange={(e) => setNewClient({...newClient, tipo: e.target.value})}
                    >
                      <option value="variable">Variable</option>
                      <option value="fijo">Fijo (Frecuente)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Dirección (Opcional)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text" 
                      className="input-pastel w-full pl-12 h-12 md:h-10 text-base"
                      placeholder="Ej: Av. Las Flores 123"
                      value={newClient.direccion}
                      onChange={(e) => setNewClient({...newClient, direccion: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-3">
                <button 
                  type="submit" 
                  disabled={createClientMutation.isPending}
                  className="w-full btn-primary h-14 font-black text-lg order-1 md:order-2 flex items-center justify-center gap-2"
                >
                  {createClientMutation.isPending ? <Loader2 className="animate-spin" /> : (
                    <>
                      <Check size={20} />
                      Guardar Cliente
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsClientModalOpen(false)} 
                  className="w-full h-14 rounded-apple-xl bg-bg-secondary dark:bg-bg-dark text-text-primary font-bold order-2 md:order-1 transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasPage;
