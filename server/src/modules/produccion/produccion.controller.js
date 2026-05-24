const ProduccionService = require('./produccion.service');

const getByJornada = async (req, res) => {
  try {
    const produccion = await ProduccionService.getByJornada(req.params.jornada_id);
    res.json(produccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producción' });
  }
};

const registrar = async (req, res) => {
  try {
    const id = await ProduccionService.registrar(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar producción' });
  }
};

const eliminar = async (req, res) => {
  try {
    await ProduccionService.eliminar(req.params.id);
    res.json({ message: 'Registro de producción eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar registro' });
  }
};

module.exports = { getByJornada, registrar, eliminar };
