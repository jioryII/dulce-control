const UserService = require('./src/modules/auth/auth.service');

async function seed() {
  try {
    const adminId = await UserService.create({
      nombre: 'Administrador Dulce',
      email: 'admin@dulcecontrol',
      password: 'admin123', // Cambiar en producción
      rol: 'admin'
    });
    console.log(`✅ Usuario admin creado con ID: ${adminId}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando admin:', error.message);
    process.exit(1);
  }
}

seed();
