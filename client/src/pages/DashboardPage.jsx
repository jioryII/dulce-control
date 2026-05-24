import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Package, Users, TrendingUp, Sparkles, ArrowUpRight, Calendar, Loader2, X, Check, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useIsMobile } from '../hooks/useIsMobile';

const DashboardPage = () => {
  const isMobile = useIsMobile();
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
      title: 'Ventas', 
      value: `S/ ${Number(statsData?.ventas || 0).toFixed(0)}`, 
      icon: ShoppingCart, 
      color: 'bg-pastel-orange', 
      textColor: 'text-orange-700' 
    },
    { 
      title: 'Producción', 
      value: `${statsData?.produccion || '0'}`, 
      icon: Package, 
      color: 'bg-pastel-cyan', 
      textColor: 'text-cyan-700' 
    },
    { 
      title: 'Clientes', 
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
    <div className="flex flex-col gap-6 md:gap-10 pb-10">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-accent p-6 md:p-8 rounded-apple-xl text-white shadow-lg animate-in fade-in slide-in-from-top duration-700">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
              <Sparkles size={isMobile ? 12 : 14} />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Bakery OS</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
              {isMobile ? 'Tu negocio hoy' : 'Tu pastelería está creciendo hoy.'}
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-md font-medium">
              {isMobile ? 'Controla ventas y producción en tiempo real.' : 'Revisa el estado de la jornada, la producción y las ventas en tiempo real.'}
            </p>
          </div>
          <img src="/multimedia/dulce-logo2_.png" alt="Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain brightness-0 invert opacity-40 absolute -right-4 -bottom-4 md:static md:opacity-50" />
        </div>
        {/* Decorative circle */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Stats Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="card-apple p-4 md:p-6 flex flex-col gap-3 md:gap-4 transition-all active:scale-95 md:hover:translate-y-[-4px] group relative overflow-hidden"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-brand-primary" size={18} />
              </div>
            )}
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} dark:bg-brand-soft/20 rounded-apple-lg flex items-center justify-center ${stat.textColor} shadow-inner`}>
                <stat.icon size={isMobile ? 20 : 24} />
              </div>
              {!isMobile && (
                <div className="p-1 bg-bg-primary rounded-full text-text-muted group-hover:text-brand-primary transition-colors">
                  <ArrowUpRight size={16} />
                </div>
              )}
            </div>
            <div>
              <p className="text-text-secondary text-[9px] md:text-[11px] font-black uppercase tracking-widest truncate">{stat.title}</p>
              <h3 className="text-xl md:text-2xl font-black text-text-primary mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-apple flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-text-primary tracking-tight">Actividad de Producción</h3>
            <Link to="/produccion" className="text-xs font-black text-brand-primary hover:underline flex items-center gap-1">
              Ver todo
              <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className={`${isMobile ? 'max-h-72' : 'h-72'} overflow-y-auto pr-2 custom-scrollbar`}>
            {isLoadingProduccion ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
              </div>
            ) : !produccionHoy || produccionHoy.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-apple-lg text-text-muted bg-bg-primary/30 py-10 md:py-0">
                <div className="w-16 h-16 bg-white dark:bg-bg-dark rounded-full shadow-sm flex items-center justify-center mb-4">
                  <Package size={32} className="opacity-20" />
                </div>
                <p className="font-bold text-xs uppercase tracking-widest">Sin actividad</p>
              </div>
            ) : (
              <div className="space-y-3">
                {produccionHoy.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 md:p-4 bg-bg-primary/50 dark:bg-bg-dark rounded-apple-lg border border-border/50 hover:border-brand-soft transition-all">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-pastel-cyan dark:bg-cyan-900/20 rounded-full flex items-center justify-center text-cyan-700 dark:text-cyan-400">
                        <Package size={isMobile ? 16 : 20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-sm truncate">{p.producto_nombre}</p>
                        <p className="text-[9px] text-text-muted uppercase font-black tracking-widest flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base md:text-lg font-black text-brand-primary">+{p.cantidad}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="card-apple flex flex-col h-fit lg:h-auto">
          <h3 className="text-lg font-black text-text-primary mb-6 tracking-tight">Jornada</h3>
          
          <div className="flex-1 space-y-6">
            <div className={`p-5 rounded-apple-lg border relative overflow-hidden ${
              jornada?.estado === 'abierta' ? 'bg-brand-soft border-brand-accent/20' : 'bg-bg-secondary border-border'
            }`}>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    jornada?.estado === 'abierta' ? 'text-brand-primary' : 'text-text-muted'
                  }`}>
                    {jornada?.estado === 'abierta' ? 'En línea' : 'Desconectado'}
                  </span>
                  {jornada?.estado === 'abierta' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                </div>
                <div className="space-y-1">
                   <p className="text-xl font-black text-text-primary tracking-tight">
                     {jornada ? new Date(jornada.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'No iniciada'}
                   </p>
                   <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Sistema de Gestión</p>
                </div>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] text-brand-primary/10 rotate-12">
                 <Calendar size={isMobile ? 80 : 100} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Control</p>
              {jornada?.estado === 'abierta' && (
                <button 
                  onClick={() => setIsClosingModalOpen(true)}
                  className="w-full btn-primary h-14 md:h-auto py-4 shadow-xl shadow-brand-primary/20 font-black text-sm tracking-wide"
                >
                  Cerrar Jornada
                </button>
              )}
              <button 
                onClick={generarPDF}
                className="w-full bg-white dark:bg-[#1C1C1E] border border-border text-text-primary font-bold py-3 rounded-apple-lg text-xs md:text-sm active:bg-bg-primary transition-all flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Generar Reporte PDF
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border hidden md:block">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pastel-cyan flex items-center justify-center text-cyan-700">
                   <Sparkles size={16} />
                </div>
                <p className="text-[10px] text-text-muted font-bold tracking-tight">Dulce Control v1.0.0</p>
             </div>
          </div>
        </div>
      </div>

      {/* Closing Modal / Bottom Sheet */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsClosingModalOpen(false)} />
          <div className={`bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in ${isMobile ? 'slide-in-from-bottom' : 'zoom-in'} duration-300 border-t md:border border-border flex flex-col max-h-[95vh]`}>
            {isMobile && <div className="w-12 h-1.5 bg-border dark:bg-[#3A3A3C] rounded-full mx-auto mt-4" />}
            
            <div className="p-6 border-b border-border flex justify-between items-center bg-bg-primary/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-soft rounded-apple-lg flex items-center justify-center text-brand-primary">
                    <Check size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary tracking-tight">Cierre de Caja</h3>
              </div>
              <button onClick={() => setIsClosingModalOpen(false)} className="w-10 h-10 bg-bg-primary dark:bg-bg-dark rounded-full flex items-center justify-center text-text-muted">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCerrarJornada} className="p-6 md:p-8 space-y-6 overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                 <div className="bg-bg-primary/50 dark:bg-bg-dark p-4 rounded-apple-xl border border-border">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Vitrina</p>
                    <p className="text-base md:text-lg font-black text-text-primary font-mono">S/ {Number(resumenCaja?.ventas_normales || 0).toFixed(2)}</p>
                 </div>
                 <div className="bg-bg-primary/50 dark:bg-bg-dark p-4 rounded-apple-xl border border-border">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Vehículos</p>
                    <p className="text-base md:text-lg font-black text-text-primary font-mono">S/ {Number(resumenCaja?.ventas_vehiculos || 0).toFixed(2)}</p>
                 </div>
              </div>

              <div className="bg-brand-soft/30 p-6 rounded-apple-xl border border-brand-accent/20 text-center">
                 <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Total Esperado</p>
                 <p className="text-4xl font-black text-brand-primary tracking-tighter font-mono">
                   S/ {Number(resumenCaja?.total_esperado || 0).toFixed(2)}
                 </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 text-center md:text-left">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1 flex items-center justify-center md:justify-start gap-2">
                    Monto Físico en Caja
                    <AlertCircle size={14} className="text-brand-accent" />
                  </label>
                  <input 
                    type="number" 
                    step="0.10"
                    inputMode="decimal"
                    required
                    className="input-pastel w-full h-16 text-3xl font-black text-center font-mono"
                    placeholder="0.00"
                    value={totalFisico}
                    onChange={(e) => setTotalFisico(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em] px-1">Observaciones</label>
                  <textarea 
                    className="input-pastel w-full h-24 py-3 resize-none text-base"
                    placeholder="Ej: Todo conforme..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-3">
                <button 
                  type="submit" 
                  disabled={cerrarJornadaMutation.isPending || !totalFisico}
                  className="w-full btn-primary h-14 font-black text-lg order-1 md:order-2 flex items-center justify-center gap-2"
                >
                  {cerrarJornadaMutation.isPending ? <Loader2 className="animate-spin" /> : 'Cerrar Jornada'}
                </button>
                <button type="button" onClick={() => setIsClosingModalOpen(false)} className="w-full h-14 rounded-apple-xl bg-bg-secondary dark:bg-bg-dark text-text-primary font-bold order-2 md:order-1 active:scale-95 transition-all">
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

export default DashboardPage;
