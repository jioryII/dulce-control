import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Tags, Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Tortas',
    precio: ''
  });

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/productos');
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newProduct) => api.post('/productos', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Producto creado');
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedProduct) => api.put(`/productos/${updatedProduct.id}`, updatedProduct),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Producto actualizado');
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/productos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Producto eliminado');
    }
  });

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre,
        categoria: product.categoria,
        precio: product.precio
      });
    } else {
      setEditingProduct(null);
      setFormData({ nombre: '', categoria: 'Tortas', precio: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ ...formData, id: editingProduct.id, activo: 1 });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Tags className="text-brand-primary" />
          Catálogo de Productos
        </h2>
        <button 
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-apple-xl shadow-shadow-sm border border-border flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o categoría..." 
            className="input-pastel w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-apple-xl shadow-shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-secondary text-text-secondary text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan="4" className="text-center py-10 text-text-muted">Cargando productos...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-10 text-text-muted">No se encontraron productos.</td></tr>
            ) : filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-bg-primary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-text-primary">{product.nombre}</td>
                <td className="px-6 py-4">
                  <span className="bg-pastel-cyan text-cyan-800 px-3 py-1 rounded-full text-xs font-bold">
                    {product.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-brand-primary">
                  S/ {parseFloat(product.precio).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openModal(product)}
                      className="p-2 text-text-muted hover:text-brand-primary hover:bg-brand-soft rounded-apple-md transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('¿Eliminar este producto?')) deleteMutation.mutate(product.id);
                      }}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-apple-md transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in zoom-in fade-in duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-primary">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Nombre del Producto</label>
                <input 
                  type="text" 
                  required
                  className="input-pastel w-full h-12"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Categoría</label>
                  <select 
                    className="input-pastel w-full h-12"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    <option>Tortas</option>
                    <option>Panes</option>
                    <option>Donas</option>
                    <option>Bocaditos</option>
                    <option>Otros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Precio (S/)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    className="input-pastel w-full h-12"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 rounded-apple-xl bg-bg-secondary text-text-primary font-bold">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                  <Check size={20} />
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
