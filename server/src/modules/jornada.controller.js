const JornadaService = require('./jornada.service');

const getHoy = async (req, res) => {
  try {
    const jornada = await JornadaService.getHoy(req.user.id);
    return res.json(jornada || null);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener jornada' });
  }
};

const abrir = async (req, res) => {
  try {
    const id = await JornadaService.abrir(req.user.id);
    res.status(201).json({ id, fecha: new Date(), estado: 'abierta' });
  } catch (error) {
    // PostgreSQL unique violation code
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Ya existe una jornada para hoy' });
    }
    res.status(500).json({ message: 'Error al abrir jornada' });
  }
};

const cerrar = async (req, res) => {
  try {
    await JornadaService.cerrar(req.params.id, req.user.id);
    res.json({ message: 'Jornada cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar jornada' });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await JornadaService.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistorial = async (req, res) => {
  try {
    const historial = await JornadaService.getHistorial(req.user.id);
    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHoy, abrir, cerrar, getStats, getHistorial };
