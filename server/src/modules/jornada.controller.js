const JornadaService = require('./jornada.service');

const getHoy = async (req, res) => {
  try {
    let jornada = await JornadaService.getHoy();
    if (!jornada) {
      // Opcional: abrir automáticamente o esperar a que el usuario lo haga
      // Por ahora solo informamos que no hay
      return res.json(null);
    }
    res.json(jornada);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener jornada' });
  }
};

const abrir = async (req, res) => {
  try {
    const id = await JornadaService.abrir(req.user.id);
    res.status(201).json({ id, fecha: new Date(), estado: 'abierta' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Ya existe una jornada para hoy' });
    }
    res.status(500).json({ message: 'Error al abrir jornada' });
  }
};

const cerrar = async (req, res) => {
  try {
    await JornadaService.cerrar(req.params.id);
    res.json({ message: 'Jornada cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar jornada' });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await JornadaService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHoy, abrir, cerrar, getStats };
