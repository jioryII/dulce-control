import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Package, Users, TrendingUp, Sparkles, ArrowUpRight, Calendar, Loader2, X, Check, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DashboardPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [totalFisico, setTotalFisico] = useState('');
  const [observacion, setObservacion] = useState('');
  
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

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/jornada/stats/hoy');
      return data;
    },
    refetchInterval: 30000
  });

  const { data: produccionHoy, isLoading: isLoadingProduccion } = useQuery({
    queryKey: ['produccion-hoy', jornada?.id],
    queryFn: async () => {
      const { data } = await api.get(`/produccion/${jornada.id}`);
      return data;
    },
    enabled: !!jornada?.id
  });

  const { data: resumenCaja } = useQuery({
    queryKey: ['resumen-caja', jornada?.id],
    queryFn: async () => {
      const { data } = await api.get(`/caja/resumen/${jornada.id}`);
      return data;
    },
    enabled: isClosingModalOpen && !!jornada?.id
  });

  const cerrarJornadaMutation = useMutation({
    mutationFn: (data) => api.post('/caja/cerrar', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['jornada-hoy', 'dashboard-stats']);
      toast.success(`Jornada cerrada. Diferencia: S/ ${Number(data.data.diferencia || 0).toFixed(2)}`);
      setIsClosingModalOpen(false);
      setTotalFisico('');
      setObservacion('');
    },
    onError: () => {
      toast.error('Error al cerrar la jornada');
    }
  });

  const handleCerrarJornada = (e) => {
    e.preventDefault();
    if (!jornada) return;
    cerrarJornadaMutation.mutate({
      jornada_id: jornada.id,
      total_fisico: parseFloat(totalFisico),
      observacion
    });
  };

  const generarPDF = () => {
    if (!jornada) return toast.error('No hay jornada activa');
    
    const doc = new jsPDF();
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#E67E43';
    
    // Encabezado
    doc.setFontSize(22);
    doc.setTextColor(themeColor);
    doc.text('DULCE CONTROL', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Sistema de Gestión de Pastelería', 14, 26);
    
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text(`Resumen Diario - ${new Date(jornada.fecha).toLocaleDateString()}`, 14, 40);
    
    // Estadísticas Principales
    autoTable(doc, {
      startY: 50,
      head: [['Concepto', 'Valor']],
      body: [
        ['Ventas del Día', `S/ ${Number(statsData?.ventas || 0).toFixed(2)}`],
        ['Producción Realizada', `${statsData?.produccion || 0} unidades`],
        ['Clientes Nuevos', `${statsData?.clientes || 0}`],
        ['Estado de Jornada', jornada.estado.toUpperCase()],
      ],
      theme: 'striped',
      headStyles: { fillColor: themeColor }
    });

    // Detalle de Producción
    if (produccionHoy && produccionHoy.length > 0) {
      const finalY = doc.lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.setTextColor(60);
      doc.text('Detalle de Producción', 14, finalY + 15);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Producto', 'Cantidad', 'Hora']],
        body: produccionHoy.map(p => [
          p.producto_nombre, 
          `+${p.cantidad}`, 
          new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        ]),
        headStyles: { fillColor: [100, 100, 100] }
      });
    }

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Documento generado el ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.getHeight() - 10);
    
    doc.save(`Resumen_${new Date(jornada.fecha).toISOString().split('T')[0]}.pdf`);
    toast.success('PDF generado con éxito');
  };

  const stats = [
    { 
      title: 'Ventas del Día', 
      value: `S/ ${Number(statsData?.ventas || 0).toFixed(2)}`, 
      icon: ShoppingCart, 
      color: 'bg-pastel-orange', 
      textColor: 'text-orange-700' 
    },
    { 
      title: 'Producción Hoy', 
      value: `${statsData?.produccion || '0'}`, 
      icon: Package, 
      color: 'bg-pastel-cyan', 
      textColor: 'text-cyan-700' 
    },
    { 
      title: 'Clientes Nuevos', 
      value: `${statsData?.clientes || '0'}`, 
      icon: Users, 
      color: 'bg-pastel-cream', 
      textColor: 'text-yellow-700' 
    },
    { 
      title: 'Crecimiento', 
      value: statsData?.crecimiento || '+0%', 
      icon: TrendingUp, 
      color: 'bg-pastel-red', 
      textColor: 'text-red-700' 
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-accent p-8 rounded-apple-xl text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
              <Sparkles size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Resumen Diario</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">Tu pastelería está creciendo hoy.</h2>
            <p className="text-white/80 max-w-md">Revisa el estado de la jornada, la producción y las ventas en tiempo real con Dulce Control.</p>
          </div>
          <img src="/multimedia/dulce-logo2_.png" alt="Logo" className="w-32 h-32 object-contain brightness-0 invert opacity-50 hidden md:block" />
        </div>
        {/* Decorative circle */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="card-apple flex flex-col gap-4 transition-all hover:translate-y-[-4px] group relative overflow-hidden"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-brand-primary" size={20} />
              </div>
            )}
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 ${stat.color} dark:bg-brand-soft/20 rounded-apple-lg flex items-center justify-center ${stat.textColor} shadow-inner`}>
                <stat.icon size={24} />
              </div>
              <div className="p-1 bg-bg-primary rounded-full text-text-muted group-hover:text-brand-primary transition-colors">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <div>
              <p className="text-text-secondary text-[11px] font-bold uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-2xl font-black text-text-primary mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-apple">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-primary">Actividad de Producción</h3>
            <Link to="/produccion" className="text-xs font-bold text-brand-primary hover:underline">Ir a Producción →</Link>
          </div>
          
          <div className="h-72 overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingProduccion ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
              </div>
            ) : !produccionHoy || produccionHoy.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-apple-lg text-text-muted bg-bg-primary/30">
                <div className="w-16 h-16 bg-white dark:bg-bg-dark rounded-full shadow-sm flex items-center justify-center mb-4">
                  <Package size={32} className="opacity-20" />
                </div>
                <p className="font-medium">Esperando datos de producción...</p>
                <p className="text-xs">Registra el horneado de hoy en el módulo de producción.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {produccionHoy.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-bg-primary rounded-apple-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pastel-cyan rounded-full flex items-center justify-center text-cyan-700">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary">{p.producto_nombre}</p>
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                          {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-brand-primary">+{p.cantidad}</p>
                      <p className="text-[10px] text-text-muted font-medium">unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="card-apple flex flex-col">
          <h3 className="text-lg font-bold text-text-primary mb-6">Estado de Jornada</h3>
          
          <div className="flex-1 space-y-6">
            <div className={`p-5 rounded-apple-lg border relative overflow-hidden ${
              jornada?.estado === 'abierta' ? 'bg-brand-soft border-brand-accent/20' : 'bg-bg-secondary border-border'
            }`}>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-sm font-bold ${
                    jornada?.estado === 'abierta' ? 'text-brand-primary' : 'text-text-muted'
                  }`}>
                    {jornada?.estado === 'abierta' ? 'Jornada Abierta' : 'Jornada Cerrada'}
                  </span>
                  <div className="flex gap-1">
                    {jornada?.estado === 'abierta' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                  </div>
                </div>
                <div className="space-y-1">
                   <p className="text-xs text-text-secondary font-medium">
                     {jornada ? `Fecha: ${new Date(jornada.fecha).toLocaleDateString()}` : 'No iniciada'}
                   </p>
                   <p className="text-xs text-text-secondary font-medium">Sistema Verificado</p>
                </div>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] text-brand-primary/10 rotate-12">
                 <Calendar size={100} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest px-1">Acciones Rápidas</p>
              {jornada?.estado === 'abierta' && (
                <button 
                  onClick={() => setIsClosingModalOpen(true)}
                  className="w-full btn-primary py-4 shadow-xl shadow-brand-primary/20"
                >
                  Cerrar Jornada y Cuadrar Caja
                </button>
              )}
              <button 
                onClick={generarPDF}
                className="w-full bg-white dark:bg-[#2C2C2E] border border-border text-text-primary font-bold py-3 rounded-apple-lg text-sm hover:bg-bg-primary transition-all flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Imprimir Resumen PDF
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pastel-cyan flex items-center justify-center text-cyan-700">
                   <Sparkles size={16} />
                </div>
                <p className="text-[10px] text-text-muted font-medium">Dulce Control v1.0.0 — Bakery System</p>
             </div>
          </div>
        </div>
      </div>

      {/* Closing Modal */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsClosingModalOpen(false)} />
          <div className="bg-white dark:bg-bg-dark w-full max-w-lg rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-300 border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary">
                    <Check size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary">Cuadre de Caja Final</h3>
              </div>
              <button onClick={() => setIsClosingModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCerrarJornada} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-bg-primary p-4 rounded-apple-xl border border-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Ventas Vitrina</p>
                    <p className="text-lg font-black text-text-primary">S/ {Number(resumenCaja?.ventas_normales || 0).toFixed(2)}</p>
                 </div>
                 <div className="bg-bg-primary p-4 rounded-apple-xl border border-border">
                    <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Ventas Vehículos</p>
                    <p className="text-lg font-black text-text-primary">S/ {Number(resumenCaja?.ventas_vehiculos || 0).toFixed(2)}</p>
                 </div>
              </div>

              <div className="bg-brand-soft/30 p-6 rounded-apple-xl border border-brand-accent/20 text-center">
                 <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">Total Esperado en Caja</p>
                 <p className="text-4xl font-black text-brand-primary tracking-tighter">
                   S/ {Number(resumenCaja?.total_esperado || 0).toFixed(2)}
                 </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    Monto Físico Contado (S/)
                    <AlertCircle size={14} className="text-brand-accent" />
                  </label>
                  <input 
                    type="number" 
                    step="0.10"
                    required
                    className="input-pastel w-full h-14 text-2xl font-black text-center"
                    placeholder="0.00"
                    value={totalFisico}
                    onChange={(e) => setTotalFisico(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Observaciones del Cierre</label>
                  <textarea 
                    className="input-pastel w-full h-24 py-3 resize-none"
                    placeholder="Ej: Faltó S/ 1.00 por cambio, o todo conforme..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsClosingModalOpen(false)} className="flex-1 px-4 py-4 rounded-apple-xl bg-bg-secondary text-text-primary font-bold">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={cerrarJornadaMutation.isPending || !totalFisico}
                  className="flex-[2] btn-primary py-4 text-lg"
                >
                  {cerrarJornadaMutation.isPending ? 'Procesando Cierre...' : 'Confirmar y Cerrar Jornada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
