const pool = require('./src/config/db');
const UserService = require('./src/modules/auth/auth.service');
const ProductService = require('./src/modules/produccion/product.service');
const JornadaService = require('./src/modules/jornada.service');
const ProduccionService = require('./src/modules/produccion/produccion.service');
const VentaService = require('./src/modules/ventas/venta.service');

async function runTests() {
  console.log('🚀 Iniciando pruebas de validación de migración...');
  
  try {
    // 1. Probar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL establecida.');

    // 2. Crear usuario de prueba
    const testEmail = `test_${Date.now()}@example.com`;
    const userId = await UserService.create({
      nombre: 'Usuario Prueba',
      email: testEmail,
      password: 'password123',
      rol: 'admin'
    });
    console.log(`✅ Usuario de prueba creado con ID: ${userId}`);

    // 3. Crear producto
    const productId = await ProductService.create({
      nombre: 'Torta de Chocolate Test',
      categoria: 'Tortas',
      precio: 15.50
    });
    console.log(`✅ Producto de prueba creado con ID: ${productId}`);

    // 4. Abrir jornada
    const fecha = new Date().toISOString().split('T')[0];
    // Eliminar jornada si existe para evitar error de duplicado en la prueba
    await pool.query('DELETE FROM jornadas WHERE fecha = $1', [fecha]);
    
    const jornadaId = await JornadaService.abrir({ fecha }, userId);
    console.log(`✅ Jornada abierta con ID: ${jornadaId}`);

    // 5. Registrar producción
    await ProduccionService.registrar({
      jornada_id: jornadaId,
      producto_id: productId,
      cantidad: 10
    });
    console.log('✅ Producción registrada exitosamente.');

    // 6. Registrar venta
    const ventaId = await VentaService.registrar({
      jornada_id: jornadaId,
      cliente_id: null,
      subtotal: 15.50,
      descuento: 0,
      total: 15.50,
      items: [{
        producto_id: productId,
        cantidad: 1,
        precio_unit: 15.50,
        subtotal: 15.50
      }]
    }, userId);
    console.log(`✅ Venta registrada exitosamente con ID: ${ventaId}`);

    // 7. Verificar Stock
    const { rows: stockRows } = await pool.query(
      'SELECT stock_actual FROM stock_diario WHERE jornada_id = $1 AND producto_id = $2',
      [jornadaId, productId]
    );
    if (stockRows[0].stock_actual === 9) {
      console.log('✅ Validación de stock correcta (10 - 1 = 9).');
    } else {
      console.error(`❌ Error en validación de stock: esperado 9, obtenido ${stockRows[0].stock_actual}`);
    }

    // 8. Cerrar jornada
    await JornadaService.cerrar(jornadaId);
    console.log('✅ Jornada cerrada exitosamente.');

    console.log('\n✨ ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE! ✨');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LAS PRUEBAS:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runTests();
