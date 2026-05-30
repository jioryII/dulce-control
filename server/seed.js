require('dotenv').config();
const UserService = require('./src/modules/auth/auth.service');
const ProductService = require('./src/modules/produccion/product.service');
const ClienteService = require('./src/modules/clientes/clientes.service');
const VehiculoService = require('./src/modules/vehiculos/vehiculo.service');
const JornadaService = require('./src/modules/jornada.service');
const ProduccionService = require('./src/modules/produccion/produccion.service');
const VentaService = require('./src/modules/ventas/venta.service');
const ContingenciaService = require('./src/modules/contingencias/contingencias.service');
const pool = require('./src/config/db');

async function seed() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Administrador Dulce';

    const demoEmail = process.env.DEMO_EMAIL;
    const demoPass = process.env.DEMO_PASSWORD;
    const demoName = process.env.DEMO_NAME || 'Demo User';

    if (!adminEmail || !adminPass || !demoEmail || !demoPass) {
      console.error('❌ Error: Las variables de entorno para ADMIN y DEMO son requeridas en el archivo .env');
      console.error('Variables necesarias: ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD');
      process.exit(1);
    }

    console.log('Iniciando inyección de datos...');

    // 1. Crear Admin
    let adminId;
    try {
      adminId = await UserService.create({
        nombre: adminName,
        email: adminEmail,
        password: adminPass,
        rol: 'admin'
      });
      console.log(`✅ Usuario Admin creado con ID: ${adminId}`);
    } catch (e) {
      console.log(`⚠️ Admin ya existe, actualizando credenciales...`);
      const { rows } = await pool.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
      if (rows.length > 0) {
        adminId = rows[0].id;
        await UserService.changePassword(adminId, adminPass);
      }
    }

    // 2. Crear Demo User
    let demoId;
    try {
      demoId = await UserService.create({
        nombre: demoName,
        email: demoEmail,
        password: demoPass,
        rol: 'admin' // Demo usually has admin rights to see everything
      });
      console.log(`✅ Usuario Demo creado con ID: ${demoId}`);
    } catch (e) {
      console.log(`⚠️ Demo ya existe, actualizando credenciales...`);
      // Si ya existe, lo buscamos para usar su ID y actualizar su password
      const { rows } = await pool.query('SELECT id FROM usuarios WHERE email = $1', [demoEmail]);
      if (rows.length > 0) {
        demoId = rows[0].id;
        await UserService.changePassword(demoId, demoPass);
      }
    }

    if (!demoId) {
       console.error('❌ No se pudo obtener el ID del usuario Demo.');
       process.exit(1);
    }

    console.log('Inyectando datos de prueba para el usuario Demo...');

    // 3. Crear Productos
    const productosData = [
      { nombre: 'Pan Francés', categoria: 'Panadería', precio: 0.30 },
      { nombre: 'Pan Ciabatta', categoria: 'Panadería', precio: 0.40 },
      { nombre: 'Pan de Yema', categoria: 'Panadería', precio: 0.50 },
      { nombre: 'Pan Integral', categoria: 'Panadería', precio: 0.60 },
      { nombre: 'Croissant', categoria: 'Bollería', precio: 2.50 },
      { nombre: 'Empanada de Carne', categoria: 'Pastelería Salada', precio: 4.00 },
      { nombre: 'Empanada de Pollo', categoria: 'Pastelería Salada', precio: 3.50 },
      { nombre: 'Pastel de Acelga', categoria: 'Pastelería Salada', precio: 4.50 },
      { nombre: 'Torta de Chocolate (Porción)', categoria: 'Pastelería Dulce', precio: 6.00 },
      { nombre: 'Pie de Limón', categoria: 'Pastelería Dulce', precio: 5.50 }
    ];

    const productosIds = [];
    for (const p of productosData) {
      const pid = await ProductService.create(p, demoId);
      productosIds.push({ id: pid, ...p });
    }
    console.log(`✅ ${productosIds.length} Productos creados.`);

    // 4. Crear Clientes
    const clientesData = [
      { nombre: 'Bodega Don Pepe', telefono: '999888777', direccion: 'Av. Las Flores 123', tipo: 'fijo' },
      { nombre: 'Minimarket El Sol', telefono: '999666555', direccion: 'Jr. Los Pinos 456', tipo: 'fijo' },
      { nombre: 'Juan Pérez (Vecino)', telefono: '999111222', direccion: '', tipo: 'variable' }
    ];
    
    const clientesIds = [];
    for (const c of clientesData) {
      const cid = await ClienteService.create(c, demoId);
      clientesIds.push(cid);
    }
    console.log(`✅ ${clientesIds.length} Clientes creados.`);

    // 5. Crear Vehículos
    const vehiculosData = [
      { nombre: 'Moto Reparto 1', placa: 'AB-123', responsable: 'Carlos Mendoza' },
      { nombre: 'Furgoneta Norte', placa: 'XYZ-987', responsable: 'Luis Ramírez' }
    ];

    const vehiculosIds = [];
    for (const v of vehiculosData) {
      const vid = await VehiculoService.create(v, demoId);
      vehiculosIds.push(vid);
    }
    console.log(`✅ ${vehiculosIds.length} Vehículos creados.`);

    // 6. Abrir Jornada Actual
    let jornadaId;
    try {
      jornadaId = await JornadaService.abrir(demoId);
      console.log(`✅ Jornada de hoy abierta con ID: ${jornadaId}`);
    } catch (e) {
      console.log('⚠️ Jornada ya estaba abierta, obteniendo ID...');
      const jornada = await JornadaService.getHoy(demoId);
      jornadaId = jornada.id;
    }

    // 7. Simular Producción
    console.log('Ingresando producción...');
    for (const p of productosIds) {
      // Producimos 100 panes, 20 pasteles, etc.
      const cantidad = p.categoria === 'Panadería' ? 100 : 20;
      await ProduccionService.registrar({
        jornada_id: jornadaId,
        producto_id: p.id,
        cantidad: cantidad,
        observacion: 'Producción de inicio de jornada'
      }, demoId);
    }
    console.log('✅ Producción registrada.');

    // 8. Simular Envíos a Vehículos
    console.log('Enviando a vehículos...');
    const envio1Id = await VehiculoService.registrarEnvio({
      jornada_id: jornadaId,
      vehiculo_id: vehiculosIds[0], // Moto 1
      hora_salida: '06:00',
      observacion: 'Ruta Sur',
      productos: [
        { producto_id: productosIds[0].id, cantidad: 40 }, // 40 Pan Frances
        { producto_id: productosIds[1].id, cantidad: 30 }  // 30 Pan Ciabatta
      ]
    }, demoId);

    const envio2Id = await VehiculoService.registrarEnvio({
      jornada_id: jornadaId,
      vehiculo_id: vehiculosIds[1], // Furgoneta 2
      hora_salida: '06:30',
      observacion: 'Ruta Norte',
      productos: [
        { producto_id: productosIds[5].id, cantidad: 10 }, // 10 Empanadas carne
        { producto_id: productosIds[6].id, cantidad: 10 }  // 10 Empanadas pollo
      ]
    }, demoId);
    console.log('✅ Envíos a vehículos registrados.');

    // 9. Simular Liquidación de 1 vehículo
    console.log('Liquidando 1 vehículo...');
    await VehiculoService.liquidarEnvio({
      envio_id: envio1Id,
      hora_llegada: '10:00',
      total_vendido: (30 * 0.30) + (25 * 0.40), // Vendió 30 y 25. Sobraron 10 y 5.
      observacion: 'Ruta terminada sin problemas',
      productos: [
        { producto_id: productosIds[0].id, cantidad_enviada: 40, cantidad_restante: 10, precio_unit: 0.30 }, 
        { producto_id: productosIds[1].id, cantidad_enviada: 30, cantidad_restante: 5, precio_unit: 0.40 }
      ]
    }, demoId);
    console.log('✅ Vehículo liquidado. Sobrantes devueltos al stock.');

    // 10. Simular Ventas en tienda
    console.log('Simulando ventas en vitrina...');
    await VentaService.registrar({
      jornada_id: jornadaId,
      cliente_id: null,
      subtotal: 5.50,
      descuento: 0,
      total: 5.50,
      observacion: '',
      items: [
        { producto_id: productosIds[9].id, cantidad: 1, precio_unit: 5.50, subtotal: 5.50 } // 1 Pie de Limón
      ]
    }, demoId);

    await VentaService.registrar({
      jornada_id: jornadaId,
      cliente_id: clientesIds[0], // Bodega Don Pepe
      subtotal: 15.00,
      descuento: 1.00,
      descuento_motivo: 'Cliente frecuente',
      total: 14.00,
      observacion: '',
      items: [
        { producto_id: productosIds[0].id, cantidad: 50, precio_unit: 0.30, subtotal: 15.00 } // 50 Pan Frances
      ]
    }, demoId);
    console.log('✅ Ventas directas registradas.');

    // 11. Simular Contingencias
    console.log('Registrando contingencias...');
    await ContingenciaService.registrar({
      jornada_id: jornadaId,
      producto_id: productosIds[8].id, // Torta chocolate
      cantidad: 1,
      motivo: 'daño',
      observacion: 'Se cayó de la vitrina'
    }, demoId);
    console.log('✅ Contingencias registradas.');

    console.log('');
    console.log('🎉 ¡Datos inyectados exitosamente!');
    console.log('Ya puedes probar el Dashboard y los módulos con la cuenta Demo.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error inyectando datos:', error.message);
    process.exit(1);
  }
}

seed();
