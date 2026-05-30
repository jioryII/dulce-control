const ContingenciaService = require('./contingencias.service');

const getByJornada = async (req, res) => {
  try {
    const data = await ContingenciaService.getByJornada(req.query.jornada_id, req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registrar = async (req, res) => {
  try {
    const id = await ContingenciaService.registrar(req.body, req.user.id);
    res.status(201).json({ id, message: 'Contingencia registrada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await ContingenciaService.eliminar(req.params.id, req.user.id);
    res.json({ message: 'Contingencia eliminada y stock devuelto' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getByJornada,
  registrar,
  eliminar
};
