# PLAN DE CORRECCIÓN: Sistema "Dulce Control"
> **Documento para Agente IA** — Leer en orden secuencial. Cada fase debe completarse antes de iniciar la siguiente. Los bloques de código son ejemplos de referencia, no copiar literalmente sin verificar el contexto del archivo real.

---

## CONTEXTO GENERAL DEL SISTEMA

- **Stack:** React (frontend), React Query (data fetching), backend con PostgreSQL/MySQL
- **Problema central:** El sistema tiene una arquitectura de "silos" — módulos completamente aislados que deberían compartir datos y contexto. Esto produce fricciones críticas en un entorno de trabajo acelerado (pastelería/POS).
- **Patrón de diseño visual:** Apple-Style — sombras suaves, bordes `rounded-apple-xl`, colores pastel.
- **Estado actual:** Funcionalidad parcial. Varios módulos son "cascarones" visuales sin lógica real.

---

## FASE 1 — CORRECCIONES CRÍTICAS (Bugs que rompen el sistema)

> **Objetivo:** Que el sistema no explote al usarse. Sin esto, nada más importa.
> **Estimado:** Completar antes de tocar UX o base de datos.

---

### BUG-01 — Dashboard en blanco (crítico)

**Archivo:** `DashboardPage.jsx`

**Síntoma:**
Al ingresar al Dashboard, la pantalla queda completamente en blanco.

**Error en consola:**
```
TypeError: statsData?.ventas?.toFixed is not a function
```

**Causa raíz:**
El backend retorna `ventas` como `string` (comportamiento estándar de funciones `SUM()` en PostgreSQL/MySQL). El componente intenta llamar `.toFixed(2)` directamente sobre ese string, lo cual lanza una excepción que rompe todo el árbol de renderizado de React.

**Acción requerida:**
Buscar en `DashboardPage.jsx` todas las llamadas `.toFixed()` sobre datos provenientes del backend y envolverlas con `Number()` o `parseFloat()`.

**Patrón a buscar:**
```javascript
// ❌ INCORRECTO — explota si es string
statsData?.ventas?.toFixed(2)

// ✅ CORRECTO — seguro contra strings y nulls
Number(statsData?.ventas || 0).toFixed(2)
```

**Alcance:** Aplicar este mismo patrón a TODOS los campos numéricos del dashboard que vengan del backend (`ventas`, `gastos`, `ganancias`, `unidades`, etc.). No asumir que solo `ventas` tiene este problema.

---

### BUG-02 — "Actividad de Producción" hardcodeada en Dashboard

**Archivo:** `DashboardPage.jsx` — componente o sección `ActividadProduccion` (o similar)

**Síntoma:**
El recuadro "Actividad de Producción" siempre muestra:
> *"Esperando datos de producción... Registra el horneado de hoy"*
Incluso cuando ya existen registros de producción en la base de datos.

**Causa raíz:**
El HTML de estado vacío está escrito de forma fija (hardcoded). No hay llamada a ningún endpoint real.

**Acción requerida:**

1. Identificar el endpoint del backend que lista la producción del día (probablemente en `/api/produccion` o similar).
2. Añadir una query de React Query en `DashboardPage.jsx`:

```javascript
const { data: produccionHoy, isLoading } = useQuery({
  queryKey: ['produccion', 'hoy'],
  queryFn: () => fetch('/api/produccion/hoy').then(r => r.json())
});
```

3. Reemplazar el bloque hardcodeado por renderizado condicional:

```jsx
{isLoading && <p>Cargando producción...</p>}
{!isLoading && produccionHoy?.length === 0 && (
  <p>Esperando datos de producción... Registra el horneado de hoy</p>
)}
{!isLoading && produccionHoy?.length > 0 && (
  <ul>
    {produccionHoy.map(item => (
      <li key={item.id}>{item.nombre} — {item.cantidad} unidades</li>
    ))}
  </ul>
)}
```

---

## FASE 2 — INTEGRACIÓN CON BASE DE DATOS (Funcionalidad real)

> **Objetivo:** Conectar los módulos que actualmente son "cascarones" a endpoints reales. Sin datos reales, el sistema no sirve.
> **Prerequisito:** Fase 1 completada.

---

### DB-01 — Mostrar stock disponible en pantalla de Ventas

**Archivo:** `VentasPage.jsx` — componente de tarjeta de producto

**Problema:**
Al armar un carrito de venta, el cajero no sabe si hay stock. Puede vender productos en cero unidades. Para verificar stock, debe abandonar la pantalla de ventas, perder el progreso y navegar a `StockPage`.

**Acción requerida:**

1. Modificar el endpoint de productos usado en Ventas para incluir el stock de la jornada actual. Si el endpoint actual es:
   ```
   GET /api/productos
   ```
   Debe pasar a hacer un `JOIN` con la tabla de stock:
   ```sql
   SELECT p.*, s.cantidad_disponible
   FROM productos p
   LEFT JOIN stock_jornada s ON s.producto_id = p.id AND s.fecha = CURRENT_DATE
   ```

2. En el componente de tarjeta de producto en el POS, mostrar la cantidad disponible:

```jsx
<div className="producto-card">
  <span>{producto.nombre}</span>
  <span className={producto.cantidad_disponible === 0 ? 'text-red-500' : 'text-green-600'}>
    Disponible: {producto.cantidad_disponible ?? '—'}
  </span>
  <button
    disabled={producto.cantidad_disponible === 0}
    onClick={() => agregarAlCarrito(producto)}
  >
    {producto.cantidad_disponible === 0 ? 'Sin stock' : 'Agregar'}
  </button>
</div>
```

3. Si `cantidad_disponible === 0`, el botón debe estar deshabilitado visualmente (no solo con lógica).

---

### DB-02 — Módulo de Reportes funcional

**Archivo:** `ReportesPage.jsx`

**Problema:**
El módulo muestra 4 tarjetas de tipos de reporte, pero el área central es un placeholder estático. Los botones "Filtrar" y "Exportar Todo" no hacen nada.

**Acciones requeridas:**

**2a — Conectar datos reales a las tarjetas:**
Identificar los endpoints del backend (`/api/reportes/ventas`, `/api/reportes/produccion`, etc.) y cargar los datos con React Query al seleccionar un tipo de reporte.

**2b — Implementar filtros:**
Los filtros de fecha y categoría deben pasarse como query params al endpoint:
```javascript
fetch(`/api/reportes/ventas?desde=${fechaInicio}&hasta=${fechaFin}`)
```

**2c — Exportación a Excel/CSV:**
Instalar y usar `xlsx` (SheetJS) para exportar los datos cargados:
```javascript
import * as XLSX from 'xlsx';

const exportarExcel = (datos, nombreArchivo) => {
  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
};
```

**2d — Gráficos:**
Usar `recharts` (ya disponible en el stack de React) para mostrar gráficos de barras o líneas con los datos del reporte activo.

---

### DB-03 — Módulo de Configuración funcional

**Archivo:** `ConfiguracionPage.jsx`

**Problema:**
Todos los apartados de configuración son visuales sin lógica. Lista de pendientes:

**3a — Mi Perfil:**
El botón "Editar Perfil" debe abrir un formulario (modal o panel) que haga `PATCH /api/usuarios/perfil` con los datos actualizados.

**3b — Apariencia (Modo Oscuro):**
Implementar con `localStorage` + clase CSS en `<html>` o con un Context de React:
```javascript
// Guardar preferencia
localStorage.setItem('theme', 'dark');
document.documentElement.classList.toggle('dark');
```
Leer la preferencia al iniciar la app en el `App.jsx` o layout raíz.

**3c — Notificaciones:**
Conectar a un servicio real. Mínimo viable: guardar las preferencias en la BD y que el backend las use al disparar alertas. Si no hay servicio de mensajería, implementar al menos alertas visuales en el sistema (ver DB-06).

**3d — Seguridad (Roles y Permisos):**
Implementar CRUD básico de roles con llamadas a `/api/usuarios` y `/api/roles`. Proteger rutas del frontend según el rol del usuario autenticado.

**3e — Base de Datos (Respaldos):**
Los botones de respaldo deben hacer `POST /api/admin/backup` y mostrar el resultado (éxito/error). Si el endpoint no existe en el backend, crearlo.

---

### DB-04 — Módulo de Vehículos: Historial de Salidas

**Archivo:** `VehiculosPage.jsx`

**Problema:**
El botón "Ver Historial de Salidas →" en cada tarjeta de vehículo no redirige ni muestra datos. No existe tabla de movimientos de flota.

**Acciones requeridas:**

1. Crear tabla en la base de datos:
```sql
CREATE TABLE movimientos_vehiculo (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos(id),
  fecha_salida TIMESTAMP,
  fecha_retorno TIMESTAMP,
  conductor VARCHAR(255),
  destino VARCHAR(255),
  observaciones TEXT
);
```

2. Crear endpoint: `GET /api/vehiculos/:id/historial`

3. Crear vista o modal en el frontend que muestre el historial al hacer clic en el botón.

---

### DB-05 — Liquidación de Repartidores

**Archivos:** Backend (`/liquidacion`), Frontend (pendiente de crear)

**Problema:**
El backend tiene carpetas para `liquidacion` pero no existe interfaz en el frontend para procesarlas.

**Acción requerida:**
Crear `LiquidacionPage.jsx` con:
- Lista de repartidores con sus vehículos asignados
- Resumen de salidas del día
- Formulario para registrar liquidación al cierre del día
- Historial de liquidaciones anteriores

Conectar a los endpoints ya existentes en el backend de `liquidacion`.

---

### DB-06 — Sistema de Notificaciones Global

**Archivos:** `Sidebar.jsx` o `MainLayout.jsx`

**Problema:**
El icono de campana de notificaciones existe en el diseño pero no tiene funcionalidad. No hay alertas de stock bajo ni de cierres de caja pendientes.

**Acción requerida:**

1. Crear endpoint de notificaciones pendientes: `GET /api/notificaciones`
   - Lógica de negocio: stock bajo (umbral configurable), liquidaciones pendientes, etc.

2. En el layout principal, añadir polling o WebSocket para actualizar el contador:
```javascript
const { data: notificaciones } = useQuery({
  queryKey: ['notificaciones'],
  queryFn: () => fetch('/api/notificaciones').then(r => r.json()),
  refetchInterval: 60000 // cada 60 segundos
});
```

3. Mostrar badge con número en el ícono de campana cuando `notificaciones.length > 0`.

4. Al hacer clic, mostrar un dropdown/panel con la lista de alertas.

---

## FASE 3 — MEJORAS DE UX/UI Y UNIFICACIÓN DE FLUJOS

> **Objetivo:** Eliminar la fragmentación entre módulos. El usuario no debe cambiar de pantalla para completar una tarea única.
> **Prerequisito:** Fases 1 y 2 completadas (o en paralelo si los datos ya están disponibles).

---

### UX-01 — Registro de Nuevo Cliente dentro de Ventas (Modal)

**Archivo:** `VentasPage.jsx`

**Problema:**
Si un cliente es nuevo, el cajero debe abandonar el flujo de venta, navegar a `ClientesPage`, crear el cliente, y volver a armar el carrito desde cero. El carrito actual se pierde.

**Solución:**
Añadir botón `[+ Nuevo Cliente]` junto al selector de clientes en `VentasPage`. Este botón abre un **modal** (sin salir de la página) con el formulario mínimo de cliente nuevo.

**Comportamiento esperado:**
1. Cajero selecciona cliente → desplegable existente (sin cambios).
2. Cliente nuevo → clic en `[+ Nuevo Cliente]`.
3. Modal se abre **sobre** la pantalla de ventas. El carrito permanece intacto.
4. Cajero llena nombre, teléfono, datos básicos.
5. Al guardar, el modal se cierra y el nuevo cliente queda **autoseleccionado** en el selector de clientes.
6. El cajero continúa la venta sin interrupciones.

**Estructura de implementación:**

```jsx
// En VentasPage.jsx
const [modalNuevoCliente, setModalNuevoCliente] = useState(false);

<div className="selector-cliente">
  <Select value={clienteSeleccionado} onChange={setClienteSeleccionado}>
    {clientes.map(c => <Option key={c.id} value={c.id}>{c.nombre}</Option>)}
  </Select>
  <button onClick={() => setModalNuevoCliente(true)}>
    + Nuevo Cliente
  </button>
</div>

{modalNuevoCliente && (
  <Modal onClose={() => setModalNuevoCliente(false)}>
    <FormularioNuevoCliente
      onSuccess={(nuevoCliente) => {
        setClienteSeleccionado(nuevoCliente.id);
        setModalNuevoCliente(false);
        // Invalidar query de clientes para que aparezca en el select
        queryClient.invalidateQueries(['clientes']);
      }}
    />
  </Modal>
)}
```

---

### UX-02 — Integrar Stock Bajo en vista de Producción

**Archivo:** `ProduccionPage.jsx`

**Problema:**
El panadero debe ir a `StockPage`, memorizar qué productos están bajos, y luego ir a `ProduccionPage` a registrar el horneado. Flujo roto en dos pantallas sin conexión visual.

**Solución:**
Dentro de `ProduccionPage`, añadir una barra lateral o panel colapsable que muestre en tiempo real los **"Productos con Stock Bajo"**.

**Comportamiento esperado:**
- Al abrir `ProduccionPage`, una sección visible (sidebar o panel superior) muestra automáticamente qué productos están por debajo del umbral mínimo, ordenados por prioridad.
- Si el panadero abre el modal de "Registrar Horneado", los productos en rojo deben estar visualmente destacados o preseleccionados.
- Al registrar un horneado, el stock se actualiza en tiempo real (via React Query invalidation).

**Estructura de implementación:**

```jsx
// Query de productos con stock bajo
const { data: stockBajo } = useQuery({
  queryKey: ['stock', 'bajo'],
  queryFn: () => fetch('/api/stock/bajo').then(r => r.json())
});

// Panel en ProduccionPage
<div className="produccion-layout">
  <div className="panel-stock-bajo">
    <h3>⚠️ Stock Bajo</h3>
    {stockBajo?.map(p => (
      <div key={p.id} className="alerta-stock">
        <span>{p.nombre}</span>
        <span className="badge-rojo">{p.cantidad} unidades</span>
      </div>
    ))}
  </div>
  <div className="area-registro-produccion">
    {/* Formulario de horneado existente */}
  </div>
</div>
```

---

### UX-03 — Validación visual de stock en el POS durante venta

**Archivo:** `VentasPage.jsx`

**Problema (complemento de DB-01):**
Además de mostrar el stock disponible, la interfaz debe proteger activamente al cajero de errores.

**Reglas de comportamiento a implementar:**

| Estado del producto | Visualización en tarjeta | Botón "Agregar" |
|---|---|---|
| Stock > umbral mínimo | Badge verde "Disponible: X" | Habilitado |
| Stock bajo (1–5 unidades) | Badge naranja "Pocas unidades: X" | Habilitado con advertencia |
| Stock = 0 | Badge rojo "Agotado" | Deshabilitado, cursor: not-allowed |

- Si el cajero intenta agregar más unidades al carrito de las disponibles en stock, mostrar un toast/alerta: *"Solo hay X unidades disponibles de este producto."*
- El campo de cantidad en el carrito debe tener `max={producto.cantidad_disponible}`.

---

### UX-04 — Coherencia visual: eliminar la "brecha de confianza"

**Archivos:** Todos los componentes que muestran acciones sin funcionalidad real.

**Problema:**
La interfaz promete muchas funciones (reportes, personalización, notificaciones) que al hacer clic no responden. Esto genera desconfianza y frustración.

**Acciones requeridas para cada botón/sección no funcional:**

**Mientras no esté implementado (transitorio):**
- Deshabilitar el botón visualmente con `disabled` o con `opacity: 0.5; cursor: not-allowed`.
- Añadir tooltip explicativo: *"Próximamente"* o *"En desarrollo"*.
- **No dejar botones que parecen funcionales pero no hacen nada.** Un botón sin acción es peor que ningún botón.

**Una vez implementado (permanente):**
- Quitar el estado disabled y conectar la acción real.

**Lista de botones a auditar:**
- [ ] `ConfiguracionPage` → "Editar Perfil"
- [ ] `ConfiguracionPage` → "Activar modo oscuro"
- [ ] `ConfiguracionPage` → "Guardar configuración de notificaciones"
- [ ] `ConfiguracionPage` → "Respaldar base de datos"
- [ ] `ReportesPage` → "Filtrar"
- [ ] `ReportesPage` → "Exportar Todo"
- [ ] `VehiculosPage` → "Ver Historial de Salidas →"
- [ ] `MainLayout` / `Sidebar` → ícono de campana de notificaciones

---

### UX-05 — Feedback de acciones al usuario (toasts y estados de carga)

**Archivos:** Todas las páginas con mutaciones (POST, PATCH, DELETE)

**Problema:**
No se especifica en el reporte pero es una consecuencia directa: si se agregan funcionalidades sin feedback visual, el usuario no sabe si su acción tuvo efecto.

**Estándar mínimo a aplicar en TODAS las acciones de escritura:**

```jsx
// Patrón con React Query useMutation
const mutation = useMutation({
  mutationFn: (datos) => fetch('/api/recurso', { method: 'POST', body: JSON.stringify(datos) }),
  onSuccess: () => {
    toast.success('Guardado correctamente');
    queryClient.invalidateQueries(['recurso']); // refrescar datos
  },
  onError: () => {
    toast.error('Ocurrió un error. Intenta nuevamente.');
  }
});

// En el botón
<button onClick={() => mutation.mutate(datos)} disabled={mutation.isPending}>
  {mutation.isPending ? 'Guardando...' : 'Guardar'}
</button>
```

Usar una librería de toasts compatible con el stack (ej: `react-hot-toast` o `sonner`).

---

## RESUMEN DE PRIORIDADES

| ID | Descripción | Fase | Impacto | Urgencia |
|---|---|---|---|---|
| BUG-01 | Dashboard en blanco por `.toFixed` en string | 1 | 🔴 Crítico | Inmediata |
| BUG-02 | Actividad de Producción hardcodeada | 1 | 🟡 Medio | Alta |
| DB-01 | Stock visible en pantalla de Ventas | 2 | 🔴 Crítico | Alta |
| UX-01 | Modal de nuevo cliente en Ventas | 3 | 🔴 Crítico | Alta |
| UX-02 | Stock bajo visible en Producción | 3 | 🟠 Alto | Alta |
| UX-03 | Validación visual de stock en POS | 3 | 🟠 Alto | Alta |
| DB-02 | Reportes funcionales con datos reales | 2 | 🟠 Alto | Media |
| DB-06 | Campana de notificaciones global | 2 | 🟡 Medio | Media |
| DB-03 | Configuración funcional (perfil, tema, permisos) | 2 | 🟡 Medio | Media |
| DB-04 | Historial de salidas de vehículos | 2 | 🟡 Medio | Baja |
| DB-05 | Interfaz de liquidación de repartidores | 2 | 🟡 Medio | Baja |
| UX-04 | Eliminar botones vacíos / brecha de confianza | 3 | 🟡 Medio | Media |
| UX-05 | Feedback de acciones (toasts + estados de carga) | 3 | 🟡 Medio | Media |

---

## NOTAS PARA EL AGENTE

- **No modificar estilos visuales globales** hasta tener toda la funcionalidad conectada. El diseño Apple-Style existente es correcto y no debe alterarse.
- **Usar React Query** para todas las llamadas al backend. No usar `fetch` directamente en componentes sin `useQuery` o `useMutation`.
- **Los modales** deben montarse con `createPortal` si el sistema lo requiere, para evitar problemas de z-index con el layout principal.
- **Cada fase puede tener PRs independientes.** No mezclar bugs de Fase 1 con cambios de UX de Fase 3.
- **Verificar que los endpoints del backend existen** antes de conectarlos en el frontend. Si no existen, crearlos primero.
- **La base de datos no debe modificarse** sin validar que las migraciones sean retrocompatibles con los datos existentes.
