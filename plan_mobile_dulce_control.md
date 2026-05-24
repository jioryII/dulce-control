# PLAN MOBILE-FIRST: Sistema "Dulce Control"
> **Documento para Agente IA** — Este documento debe leerse COMPLETO antes de tocar cualquier archivo de estilos o layout. El objetivo no es solo "hacer responsive" — es rediseñar la experiencia para que el teléfono sea el dispositivo principal. Desktop es secundario.

---

## PRINCIPIO RECTOR

> **"Mobile-first, desktop-enhanced"**: Todo componente se diseña primero para pantalla de ~390px. Luego se escala hacia arriba para tablets y desktop. Nunca al revés.

El sistema actualmente es **responsive pero no mobile-friendly**. La diferencia crítica:
- **Responsive:** Los elementos se achican para entrar en pantalla.
- **Mobile-friendly:** Los elementos se redesignan para ser cómodos con el dedo, en condiciones de uso real (una mano, de pie, con prisa).

---

## CONFIGURACIÓN BASE (Aplicar antes de cualquier otra cosa)

### CONFIG-01 — Viewport y meta tag

**Archivo:** `index.html`

Verificar que exista exactamente esto en el `<head>`. Sin esto, nada funciona:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

El `user-scalable=no` evita el zoom accidental al tocar inputs en iOS.

---

### CONFIG-02 — Variables CSS de breakpoints (sistema unificado)

**Archivo:** `index.css` o el archivo de variables globales del proyecto

Definir y usar SIEMPRE estos breakpoints. No inventar valores nuevos en cada componente:

```css
/* Breakpoints estándar — NO usar valores ad-hoc en componentes */
/* mobile:  < 640px  → diseño base, sin media query */
/* tablet:  >= 640px → @media (min-width: 640px) */
/* desktop: >= 1024px → @media (min-width: 1024px) */

:root {
  /* Touch targets mínimos */
  --touch-min: 44px;        /* Apple HIG: mínimo absoluto para botones táctiles */
  --touch-comfort: 52px;    /* Tamaño cómodo para uso con pulgar */
  --touch-large: 64px;      /* Botones de acción primaria en POS */

  /* Espaciado mobile */
  --spacing-mobile-xs: 8px;
  --spacing-mobile-sm: 12px;
  --spacing-mobile-md: 16px;
  --spacing-mobile-lg: 24px;

  /* Tipografía mobile */
  --text-mobile-xs: 11px;
  --text-mobile-sm: 13px;
  --text-mobile-base: 15px;
  --text-mobile-lg: 17px;
  --text-mobile-xl: 20px;
  --text-mobile-2xl: 24px;
}
```

---

### CONFIG-03 — Detección de pantalla pequeña en React

**Archivo:** Crear `hooks/useIsMobile.js`

Este hook debe usarse en componentes que necesiten lógica condicional (no solo CSS):

```javascript
import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return isMobile;
};

// Uso en componente:
// const isMobile = useIsMobile();
// if (isMobile) return <VersionMovil />;
// return <VersionDesktop />;
```

---

## FASE MOBILE-1 — LAYOUT Y NAVEGACIÓN

> Lo primero que el usuario ve y toca. Si la navegación no funciona en móvil, nada más importa.

---

### MOB-01 — Sidebar → Bottom Navigation Bar en móvil

**Archivo:** `Sidebar.jsx` o `MainLayout.jsx`

**Problema actual:**
El sidebar lateral es estándar en desktop pero inutilizable en móvil: ocupa espacio horizontal valioso, los ítems son difíciles de tocar, y hay que hacer scroll lateral para acceder.

**Solución:**
En pantallas < 640px, reemplazar el sidebar por una **barra de navegación inferior** fija (bottom nav), que es el patrón estándar de apps móviles (Instagram, WhatsApp, etc.).

**Estructura de implementación:**

```jsx
// MainLayout.jsx
const isMobile = useIsMobile();

return (
  <div className="app-layout">
    {!isMobile && <Sidebar />}              {/* Solo en desktop */}
    <main className={isMobile ? 'pb-20' : 'ml-64'}>  {/* Padding bottom en móvil para no tapar contenido */}
      {children}
    </main>
    {isMobile && <BottomNavBar />}          {/* Solo en móvil */}
  </div>
);
```

**Componente BottomNavBar:**

```jsx
// components/BottomNavBar.jsx
const NAV_ITEMS = [
  { label: 'Inicio',      icon: HomeIcon,      path: '/dashboard' },
  { label: 'Ventas',      icon: ShoppingBagIcon, path: '/ventas' },
  { label: 'Producción',  icon: FireIcon,      path: '/produccion' },
  { label: 'Stock',       icon: CubeIcon,      path: '/stock' },
  { label: 'Más',         icon: EllipsisHorizontalIcon, path: '/menu' },
];

export const BottomNavBar = () => {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: 'white',
      borderTop: '1px solid #f0f0f0',
      display: 'flex',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)' /* iPhone notch */
    }}>
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '44px',
            gap: '2px',
            fontSize: '10px',
            color: location.pathname === item.path ? 'var(--color-primary)' : '#999'
          }}
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
```

**Regla:** La bottom nav solo debe mostrar los 4-5 módulos más usados. El resto va bajo "Más" que abre un menú sheet desde abajo (ver MOB-02).

---

### MOB-02 — Menú "Más" como Bottom Sheet

**Archivo:** Crear `components/MoreMenuSheet.jsx`

Los módulos secundarios (Configuración, Reportes, Vehículos, Clientes) van en un **bottom sheet** que sube desde abajo al tocar "Más":

```jsx
// Bottom sheet con los módulos secundarios
// Se abre con animación slide-up desde el borde inferior
// Fondo oscuro semitransparente al abrir
// Se cierra deslizando hacia abajo o tocando el fondo
```

**CSS base para bottom sheet:**
```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 2000;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1999;
}
```

---

### MOB-03 — Header de página compacto en móvil

**Archivos:** Todos los componentes de página (`DashboardPage.jsx`, `VentasPage.jsx`, etc.)

**Problema:**
Los headers de página en desktop tienen títulos grandes, subtítulos, botones alineados. En móvil esto ocupa 20-30% de la pantalla útil.

**Regla mobile:**
```css
/* Desktop: título grande + subtítulo + botones en fila */
/* Mobile: título compacto + botón de acción primaria únicamente */

@media (max-width: 639px) {
  .page-header {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-title {
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
  }

  .page-subtitle {
    display: none; /* Ocultar subtítulos en móvil */
  }

  .page-header-actions {
    /* Solo mostrar el botón de acción más importante */
    /* El resto en un menú de 3 puntos (⋮) */
  }
}
```

---

## FASE MOBILE-2 — PANTALLA DE VENTAS (POS)

> La pantalla más crítica del sistema. Se usa de pie, con una mano, bajo presión de velocidad.

---

### MOB-04 — Layout del POS rediseñado para móvil

**Archivo:** `VentasPage.jsx`

**Problema actual:**
El POS probablemente tiene un layout de dos columnas: lista de productos a la izquierda y carrito a la derecha. En móvil ambas columnas se apilan y hay que hacer scroll para ver el carrito.

**Solución: Tabs en móvil**

```jsx
// En móvil: dos tabs "Productos" y "Carrito (3)"
// En desktop: layout de dos columnas

const [tabActiva, setTabActiva] = useState('productos'); // 'productos' | 'carrito'

if (isMobile) {
  return (
    <div>
      {/* Tab bar superior */}
      <div className="pos-tabs">
        <button
          className={tabActiva === 'productos' ? 'tab-activa' : ''}
          onClick={() => setTabActiva('productos')}
        >
          Productos
        </button>
        <button
          className={tabActiva === 'carrito' ? 'tab-activa' : ''}
          onClick={() => setTabActiva('carrito')}
        >
          Carrito {carrito.length > 0 && <span className="badge">{carrito.length}</span>}
        </button>
      </div>

      {tabActiva === 'productos' && <ListaProductosPOS />}
      {tabActiva === 'carrito' && <CarritoPOS />}

      {/* Botón flotante para ir al carrito (siempre visible) */}
      {tabActiva === 'productos' && carrito.length > 0 && (
        <button
          className="fab-carrito"
          onClick={() => setTabActiva('carrito')}
        >
          Ver carrito · {carrito.length} items · S/ {totalCarrito}
        </button>
      )}
    </div>
  );
}
```

**CSS del botón flotante de carrito:**
```css
.fab-carrito {
  position: fixed;
  bottom: calc(64px + 16px); /* Por encima de bottom nav */
  left: 16px;
  right: 16px;
  height: 52px;
  background: var(--color-primary);
  color: white;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  z-index: 900;
}
```

---

### MOB-05 — Tarjetas de producto adaptadas al dedo

**Archivo:** Componente de tarjeta de producto en el POS

**Reglas:**
- Tamaño mínimo de tarjeta: 100% del ancho disponible en lista, o grid de 2 columnas.
- El botón "Agregar" debe ocupar al menos **44px de alto**.
- El texto del nombre del producto máximo 2 líneas (usar `line-clamp: 2`).
- El precio y el stock en texto legible (mínimo 13px).
- No mostrar descripciones largas en la tarjeta del POS móvil.

```css
@media (max-width: 639px) {
  .producto-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .producto-card {
    border-radius: 14px;
    padding: 12px;
    min-height: 110px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .producto-nombre {
    font-size: 13px;
    font-weight: 600;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .producto-precio {
    font-size: 15px;
    font-weight: 700;
  }

  .producto-stock {
    font-size: 11px;
  }

  .btn-agregar {
    min-height: 44px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    margin-top: 8px;
  }
}
```

---

### MOB-06 — Carrito optimizado para móvil

**Archivo:** Componente del carrito en `VentasPage.jsx`

**Reglas:**
- Cada ítem del carrito debe tener controles de cantidad (`-` / `+`) de al menos **44x44px**.
- El botón de eliminar ítem debe ser fácilmente accesible (swipe-to-delete o botón visible).
- El resumen (subtotal, total) debe estar siempre visible sin scroll.
- El botón "Cobrar / Confirmar venta" debe ser el elemento más grande de la pantalla: **mínimo 56px de alto**, ancho completo, color llamativo.

```css
@media (max-width: 639px) {
  .carrito-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
    align-items: center;
  }

  .cantidad-control {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cantidad-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #e0e0e0;
    background: white;
  }

  .cantidad-valor {
    min-width: 32px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
  }

  .btn-cobrar {
    width: 100%;
    height: 56px;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    position: sticky;
    bottom: calc(64px + 12px);
    margin-top: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
}
```

---

## FASE MOBILE-3 — FORMULARIOS Y MODALES

> En móvil, un formulario mal diseñado es el mayor punto de abandono.

---

### MOB-07 — Inputs táctiles y teclados correctos

**Aplica a:** Todos los formularios del sistema

**Reglas absolutas:**

```jsx
/* 1. Altura mínima de input: 48px */
/* 2. Fuente mínima: 16px (evita zoom automático en iOS) */
/* 3. type correcto en cada input para abrir el teclado correcto */

// Nombres, texto libre
<input type="text" inputMode="text" />

// Números enteros (cantidad de productos)
<input type="number" inputMode="numeric" pattern="[0-9]*" />

// Precios, decimales
<input type="number" inputMode="decimal" step="0.01" />

// Teléfono
<input type="tel" inputMode="tel" />

// Email
<input type="email" inputMode="email" autoCapitalize="none" />
```

```css
@media (max-width: 639px) {
  input, select, textarea {
    min-height: 48px;
    font-size: 16px !important; /* Crítico: evita zoom en iOS con <16px */
    border-radius: 12px;
    padding: 12px 14px;
    width: 100%;
    box-sizing: border-box;
  }

  label {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
    display: block;
  }

  .form-group {
    margin-bottom: 16px;
  }
}
```

---

### MOB-08 — Modales como bottom sheets en móvil

**Aplica a:** Todos los modales del sistema (nuevo cliente, registrar horneado, etc.)

**Problema:**
Los modales centrados en desktop (cuadro flotante en el centro de la pantalla) son incómodos en móvil: el teclado los empuja, el contenido queda fuera de vista, y cerrarlos es difícil.

**Solución:**
En móvil, todos los modales se transforman en **bottom sheets** que suben desde abajo:

```jsx
// Modal.jsx — wrapper universal
const Modal = ({ isOpen, onClose, title, children }) => {
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  if (isMobile) {
    return createPortal(
      <>
        <div className="modal-overlay" onClick={onClose} />
        <div className="bottom-sheet open">
          {/* Handle de arrastre visual */}
          <div className="sheet-handle" />
          <div className="sheet-header">
            <h2>{title}</h2>
            <button onClick={onClose} className="btn-cerrar-sheet">✕</button>
          </div>
          <div className="sheet-body">
            {children}
          </div>
        </div>
      </>,
      document.body
    );
  }

  // Versión desktop: modal centrado tradicional
  return createPortal(
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-desktop">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </>,
    document.body
  );
};
```

```css
@media (max-width: 639px) {
  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 90vh;
    background: white;
    border-radius: 20px 20px 0 0;
    overflow-y: auto;
    padding: 0 16px calc(16px + env(safe-area-inset-bottom));
    z-index: 2000;
    -webkit-overflow-scrolling: touch;
  }

  .sheet-handle {
    width: 36px;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    margin: 12px auto 8px;
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0 16px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  .btn-cerrar-sheet {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f5f5f5;
    border: none;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

---

### MOB-09 — Botones de acción en formularios

**Regla general para todos los formularios:**

```css
@media (max-width: 639px) {
  /* Botones siempre ancho completo en móvil */
  .btn-primary,
  .btn-secondary,
  .btn-danger {
    width: 100%;
    min-height: 52px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
  }

  /* Si hay dos botones (Guardar / Cancelar), apilarlos verticalmente */
  .form-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  /* El botón primario siempre primero (arriba) */
  .btn-primary { order: 1; }
  .btn-secondary { order: 2; }
}
```

---

## FASE MOBILE-4 — TABLAS Y DATOS

> Las tablas son el mayor problema en móvil. Nunca mostrar una tabla horizontal en pantalla angosta.

---

### MOB-10 — Convertir tablas en tarjetas (Card List Pattern)

**Aplica a:** `StockPage`, `ClientesPage`, `VehiculosPage`, `ReportesPage`, cualquier tabla de datos

**Problema:**
Las tablas HTML (`<table>`) con múltiples columnas se salen de la pantalla en móvil o hacen scroll horizontal que es inmanejable con el dedo.

**Solución:**
En móvil, reemplazar las filas de tabla por tarjetas verticales:

```jsx
// Componente de tabla adaptativa
const TablaAdaptativa = ({ columnas, datos, renderTarjeta }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="lista-tarjetas">
        {datos.map((fila, i) => renderTarjeta(fila, i))}
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>{columnas.map(col => <th key={col.key}>{col.label}</th>)}</tr>
      </thead>
      <tbody>
        {datos.map((fila, i) => (
          <tr key={i}>
            {columnas.map(col => <td key={col.key}>{fila[col.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Uso para tabla de stock
<TablaAdaptativa
  columnas={columnas}
  datos={productos}
  renderTarjeta={(producto) => (
    <div key={producto.id} className="tarjeta-stock">
      <div className="tarjeta-stock-header">
        <span className="nombre">{producto.nombre}</span>
        <span className={`badge-stock ${producto.cantidad < 5 ? 'bajo' : 'ok'}`}>
          {producto.cantidad} uds
        </span>
      </div>
      <div className="tarjeta-stock-footer">
        <span className="categoria">{producto.categoria}</span>
        <span className="precio">S/ {producto.precio}</span>
      </div>
    </div>
  )}
/>
```

```css
@media (max-width: 639px) {
  .lista-tarjetas {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }

  .tarjeta-stock {
    background: white;
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tarjeta-stock-header,
  .tarjeta-stock-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
```

---

### MOB-11 — Dashboard: de grid de KPIs a scroll vertical

**Archivo:** `DashboardPage.jsx`

**Problema:**
El dashboard probablemente tiene un grid de 3-4 columnas con tarjetas de métricas. En móvil quedan aplastadas e ilegibles.

**Solución:**

```css
@media (max-width: 639px) {
  /* Grid de KPIs: de 3-4 columnas a 2 columnas */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .kpi-card {
    border-radius: 16px;
    padding: 14px 12px;
    min-height: 90px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .kpi-label {
    font-size: 11px;
    opacity: 0.6;
    line-height: 1.2;
  }

  .kpi-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
  }

  .kpi-change {
    font-size: 11px;
  }

  /* Secciones del dashboard en columna única */
  .dashboard-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 12px 12px;
  }

  /* Limitar altura de secciones para no ocupar toda la pantalla */
  .seccion-actividad {
    max-height: 280px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

---

### MOB-12 — Módulo de Producción en móvil

**Archivo:** `ProduccionPage.jsx`

**Reglas específicas:**
- El panel de "Stock Bajo" (de plan de corrección UX-02) en móvil va como una tira horizontal deslizable (`scroll-x`) en la parte superior, no como sidebar.
- Los registros de horneado del día van en lista de tarjetas (ver MOB-10).
- El botón "Registrar Horneado" es un FAB (botón flotante) en la esquina inferior derecha.

```css
@media (max-width: 639px) {
  /* Tira horizontal de stock bajo */
  .stock-bajo-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 12px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .stock-bajo-strip::-webkit-scrollbar { display: none; }

  .stock-bajo-chip {
    flex-shrink: 0;
    scroll-snap-align: start;
    padding: 8px 12px;
    background: #FFF3E0;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #E65100;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* FAB de nuevo horneado */
  .fab-nuevo-horneado {
    position: fixed;
    bottom: calc(64px + 16px);
    right: 16px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    font-size: 24px;
    border: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

---

## FASE MOBILE-5 — REGLAS GLOBALES ANTI-OVERFLOW

> Ningún elemento debe salirse de la pantalla. Estas reglas se aplican globalmente.

---

### MOB-13 — CSS global anti-overflow (aplicar en `index.css`)

```css
/* ============================================
   REGLAS GLOBALES ANTI-OVERFLOW PARA MÓVIL
   Aplicar en index.css o el archivo CSS raíz
   ============================================ */

/* 1. Prevenir overflow horizontal en TODO el documento */
html, body {
  max-width: 100vw;
  overflow-x: hidden;
}

/* 2. Todos los elementos respetan su contenedor */
*, *::before, *::after {
  box-sizing: border-box;
  max-width: 100%;
}

/* 3. Imágenes y medios siempre contenidos */
img, video, canvas, svg {
  max-width: 100%;
  height: auto;
}

/* 4. Textos muy largos (URLs, códigos) hacen wrap */
p, span, td, th, li, label {
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 5. Inputs no se salen del contenedor en iOS */
input, select, textarea {
  max-width: 100%;
  box-sizing: border-box;
}

/* 6. Flexbox: evitar que hijos crezcan más allá del padre */
.flex-container {
  min-width: 0; /* Fix crítico para flex children */
}
```

---

### MOB-14 — Espaciado lateral consistente

**Regla:** Todo contenido debe tener padding horizontal de `16px` en móvil. Nunca `0px` de padding en pantalla pequeña.

```css
@media (max-width: 639px) {
  /* Clase utilitaria — añadir a todos los contenedores de página */
  .page-container {
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: calc(80px + env(safe-area-inset-bottom)); /* espacio para bottom nav */
  }

  /* Contenedores que ya tienen padding propio */
  .card, .panel, .seccion {
    padding: 14px;
  }
}
```

---

### MOB-15 — Safe areas para iPhone con notch/Dynamic Island

```css
/* Aplicar en el layout raíz */
.app-layout {
  /* Padding para el notch superior en iOS */
  padding-top: env(safe-area-inset-top);
}

.bottom-nav {
  /* Padding para el home indicator de iPhone */
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## CHECKLIST DE VERIFICACIÓN PARA EL AGENTE

Antes de marcar cualquier módulo como "mobile-ready", verificar **todos** estos puntos:

### Navegación
- [ ] Bottom nav visible y funcional en < 640px
- [ ] Sidebar oculto en < 640px
- [ ] Módulos secundarios accesibles desde "Más" → bottom sheet

### Interacción táctil
- [ ] Todos los botones tienen mínimo 44x44px de área táctil
- [ ] Botones de acción primaria tienen mínimo 52px de alto
- [ ] Los controles de cantidad (`+` / `-`) tienen mínimo 44x44px
- [ ] No hay elementos interactivos con área táctil < 44px

### Formularios
- [ ] Todos los inputs tienen `font-size: 16px` mínimo (evita zoom iOS)
- [ ] `inputMode` correcto en cada campo numérico/telefónico
- [ ] Labels visibles y legibles
- [ ] Botones de submit son ancho completo
- [ ] Modales se abren como bottom sheets en móvil

### Tablas y datos
- [ ] Ninguna tabla HTML visible en < 640px (reemplazar por tarjetas)
- [ ] Dashboard en grid de 2 columnas en móvil
- [ ] Listas con scroll suave (`-webkit-overflow-scrolling: touch`)

### Layout
- [ ] `box-sizing: border-box` global aplicado
- [ ] Sin overflow horizontal (verificar con DevTools → Responsive → 390px)
- [ ] Padding lateral mínimo 16px en todos los contenedores
- [ ] `padding-bottom` suficiente para no tapar contenido con bottom nav
- [ ] Safe areas de iPhone aplicadas (notch + home indicator)

### POS (Ventas)
- [ ] Layout de tabs en móvil (Productos / Carrito)
- [ ] Botón flotante "Ver carrito" visible cuando hay ítems
- [ ] Botón "Cobrar" sticky en la parte inferior
- [ ] Stock visible en cada tarjeta de producto

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

```
1. CONFIG-01, CONFIG-02, CONFIG-03  →  Base técnica
2. MOB-13, MOB-14, MOB-15          →  CSS global anti-overflow
3. MOB-01, MOB-02, MOB-03          →  Navegación y layout
4. MOB-04, MOB-05, MOB-06          →  POS (mayor prioridad de negocio)
5. MOB-07, MOB-08, MOB-09          →  Formularios y modales
6. MOB-10, MOB-11, MOB-12          →  Tablas y datos
7. Checklist de verificación        →  QA final
```

---

## NOTAS FINALES PARA EL AGENTE

- **Nunca usar `px` fijos para ancho de contenedores** en el CSS de layout. Usar `%`, `vw`, `fr`, o `max-width` con `width: 100%`.
- **Probar siempre en 390px de ancho** (iPhone 14 Pro) como pantalla de referencia móvil.
- **El zoom automático de iOS** se activa cuando un input tiene `font-size < 16px`. Es el bug más molesto y más fácil de evitar.
- **Los `position: fixed` en iOS con teclado abierto** se comportan de forma extraña. Para el bottom nav, usar `position: fixed` con `bottom: env(safe-area-inset-bottom)`.
- **No animar transforms en scroll** — causa lag severo en móviles de gama media-baja.
- **Este sistema es un POS de uso diario intensivo.** La velocidad de interacción importa más que la animación. Priorizar respuesta táctil inmediata sobre efectos decorativos.
