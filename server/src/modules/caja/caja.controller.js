const CajaService = require('./caja.service');

const getResumen = async (req, res) => {
  try {
    const resumen = await CajaService.getResumenCierre(req.params.jornadaId);
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cerrarCaja = async (req, res) => {
  try {
    const result = await CajaService.procesarCuadre(req.body, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getResumen,
  cerrarCaja
};
