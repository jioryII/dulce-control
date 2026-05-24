import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ShoppingCart, Search, Plus, Minus, Trash2, Check, User, Users, X, UserPlus, Phone, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VentasPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
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
    queryKey: ['products'],
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

  const registrarVentaMutation = useMutation({
    mutationFn: (ventaData) => api.post('/ventas', ventaData),
    onSuccess: () => {
      queryClient.invalidateQueries(['products', 'stock-diario', 'dashboard-stats']);
      toast.success('Venta realizada con éxito');
      setCart([]);
      setSelectedClientId('');
    }
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData) => api.post('/clientes', clientData),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['clientes']);
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

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!jornada) return toast.error('Debes abrir la jornada primero');

    const subtotal = calculateTotal();
    const ventaData = {
      jornada_id: jornada.id,
      cliente_id: selectedClientId || null,
      subtotal: subtotal,
      descuento: 0,
      total: subtotal,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              className="input-pastel w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-80 flex gap-2">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <select 
                className="input-pastel w-full pl-10"
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock_actual === 0;
            const isLowStock = product.stock_actual > 0 && product.stock_actual <= 5;
            
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={isOutOfStock}
                className={`bg-white dark:bg-[#1C1C1E] p-4 rounded-apple-xl border transition-all text-left group relative ${
                  isOutOfStock 
                    ? 'opacity-60 grayscale cursor-not-allowed border-border' 
                    : 'border-border hover:border-brand-primary hover:shadow-shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-apple-lg flex items-center justify-center mb-3 transition-transform ${
                  isOutOfStock ? 'bg-bg-secondary dark:bg-bg-dark text-text-muted' : 'bg-brand-soft text-brand-primary group-hover:scale-110'
                }`}>
                  <ShoppingCart size={20} />
                </div>
                <h4 className="font-bold text-text-primary text-sm truncate">{product.nombre}</h4>
                <div className="flex justify-between items-end mt-1">
                  <p className="text-brand-primary font-mono font-bold text-sm">S/ {parseFloat(product.precio).toFixed(2)}</p>
                  
                  {isOutOfStock ? (
                    <span className="text-[9px] font-black uppercase tracking-tighter text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/30">
                      Agotado
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[9px] font-black uppercase tracking-tighter text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30">
                      Pocas: {product.stock_actual}
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-tighter text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/30">
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
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[32px] shadow-shadow-lg border border-border overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-8">
          <div className="p-6 border-b border-border bg-bg-primary/30">
            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <ShoppingCart className="text-brand-primary" />
              Resumen de Venta
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-40">
                <ShoppingCart size={48} className="mb-4" />
                <p className="font-bold uppercase text-xs tracking-widest">El carrito está vacío</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 group animate-in slide-in-from-right-4 duration-300">
                <div className="w-12 h-12 bg-bg-primary dark:bg-bg-dark rounded-apple-lg flex items-center justify-center text-text-primary font-bold border border-border">
                  {item.cantidad}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-primary text-sm truncate">{item.nombre}</h4>
                  <p className="text-xs text-text-secondary">S/ {parseFloat(item.precio).toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-white dark:bg-bg-dark flex items-center justify-center border border-border text-text-primary hover:bg-bg-primary">
                    <Minus size={12} />
                  </button>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-white dark:bg-bg-dark flex items-center justify-center border border-border text-text-primary hover:bg-bg-primary">
                    <Plus size={12} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="ml-2 text-text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-bg-primary/50 dark:bg-bg-dark border-t border-border space-y-4">
            <div className="flex justify-between items-center text-text-secondary font-medium">
              <span>Subtotal</span>
              <span>S/ {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-text-primary text-2xl font-black tracking-tighter">
              <span>Total</span>
              <span className="text-brand-primary">S/ {calculateTotal().toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || registrarVentaMutation.isLoading}
              className="w-full btn-primary py-4 text-lg font-bold shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3"
            >
              {registrarVentaMutation.isLoading ? <Loader2 className="animate-spin" /> : (
                <>
                  <Check size={20} />
                  Completar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsClientModalOpen(false)} />
          <div className="bg-white dark:bg-bg-dark w-full max-w-md rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-300 border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary">
                    <UserPlus size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary">Nuevo Cliente</h3>
              </div>
              <button onClick={() => setIsClientModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input 
                      type="text" 
                      required
                      className="input-pastel w-full pl-10"
                      placeholder="Ej: Juan Pérez"
                      value={newClient.nombre}
                      onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                      <input 
                        type="tel" 
                        className="input-pastel w-full pl-10"
                        placeholder="999..."
                        value={newClient.telefono}
                        onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Tipo</label>
                    <select 
                      className="input-pastel w-full"
                      value={newClient.tipo}
                      onChange={(e) => setNewClient({...newClient, tipo: e.target.value})}
                    >
                      <option value="variable">Variable</option>
                      <option value="fijo">Fijo (Frecuente)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Dirección (Opcional)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input 
                      type="text" 
                      className="input-pastel w-full pl-10"
                      placeholder="Ej: Av. Las Flores 123"
                      value={newClient.direccion}
                      onChange={(e) => setNewClient({...newClient, direccion: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 px-4 py-4 rounded-apple-xl bg-bg-secondary text-text-primary font-bold">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={createClientMutation.isPending}
                  className="flex-[2] btn-primary py-4 text-lg"
                >
                  {createClientMutation.isPending ? 'Guardando...' : 'Crear Cliente'}
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
