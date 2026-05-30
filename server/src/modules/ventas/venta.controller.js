const VentaService = require('./venta.service');

const registrar = async (req, res) => {
  try {
    const id = await VentaService.registrar(req.body, req.user.id);
    res.status(201).json({ id, message: 'Venta registrada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la venta: ' + error.message });
  }
};

const getByJornada = async (req, res) => {
  try {
    const ventas = await VentaService.getByJornada(req.query.jornada_id, req.user.id);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
};

module.exports = { registrar, getByJornada };
