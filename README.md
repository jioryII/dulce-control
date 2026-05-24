

<div align="center">
  <img src="client/public/multimedia/dulce-logo2_.png" alt="Dulce Control Logo" width="90%" />
  <p><strong>Gestión integral de producción, ventas y logística para pastelerías.</strong></p>
</div>

---

## 🚀 Sobre el Proyecto

**Dulce Control** es una solución robusta diseñada para optimizar los procesos operativos de una pastelería. Desde el control de la producción diaria hasta la liquidación de ventas en vehículos de reparto, el sistema ofrece una visión clara y en tiempo real del estado del negocio.

### 🛠️ Tecnologías Principales
- **Frontend:** React (Vite), Tailwind CSS, React Router, TanStack Query.
- **Backend:** Node.js, Express.js.
- **Base de Datos:** PostgreSQL.
- **Seguridad:** Autenticación JWT, Encriptación Bcrypt, Helmet para headers de seguridad.

---

## ✨ Características Principales

- **📦 Gestión de Productos:** Catálogo completo con categorías y precios.
- **🥖 Control de Producción:** Registro diario de productos elaborados vinculados a jornadas.
- **📊 Inventario (Stock):** Seguimiento automático de existencias iniciales y actuales.
- **🛒 Punto de Venta (Caja):** Registro de ventas directas a clientes con gestión de descuentos.
- **🚚 Logística y Reparto:** 
  - Envío de productos a vehículos.
  - Liquidación de ventas al retorno del vehículo.
  - Control de sobrantes y ventas automáticas.
- **💰 Cuadre de Caja:** Conciliación entre ventas esperadas (normales + vehículos) y dinero físico.
- **📉 Reportes:** Visualización de rendimiento y estadísticas.
- **👤 Administración de Usuarios:** Roles definidos (Admin, Producción, Caja, Reparto).

---

## 🛠️ Instalación y Configuración

### Requisitos Previos
- Node.js (v18+)
- PostgreSQL (v14+)
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/jioryII/dulce-control.git
cd dulce-control
```

### 2. Configuración del Servidor (Backend)
```bash
cd server
npm install
```
Crea un archivo `.env` en la carpeta `server` con los siguientes datos:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=pasteleria_db
JWT_SECRET=tu_secreto_super_seguro
```

### 3. Inicializar la Base de Datos
```bash
# Crea la DB e importa el esquema
node initDB.js

# Crea el usuario administrador por defecto
node seed.js
```

### 4. Configuración del Cliente (Frontend)
```bash
cd ../client
npm install
npm run dev
```

---

## 🔑 Credenciales de Acceso (Por Defecto)

Una vez ejecutado el comando `node seed.js`, puedes ingresar con:

- **Email:** `admin@dulcecontrol`
- **Contraseña:** `admin123`

---

## 📂 Estructura del Proyecto

- `/client`: Aplicación frontend en React.
- `/server`: API RESTful en Node.js.
- `/server/database.sql`: Esquema completo de la base de datos PostgreSQL.

---

## 🤝 Contribución
Las contribuciones son bienvenidas. Siéntete libre de abrir un issue o enviar un pull request para mejoras.

---
<div align="center">
  Hecho con ❤️ para Dulce Control
</div>
