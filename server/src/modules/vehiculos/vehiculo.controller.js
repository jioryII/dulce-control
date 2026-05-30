const VehiculoService = require('./vehiculo.service');

const getAll = async (req, res) => {
  try {
    const vehiculos = await VehiculoService.getAll(req.user.id);
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const id = await VehiculoService.create(req.body, req.user.id);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    await VehiculoService.update(req.params.id, req.body, req.user.id);
    res.json({ message: 'Vehículo actualizado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await VehiculoService.delete(req.params.id, req.user.id);
    res.json({ message: 'Vehículo eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistorial = async (req, res) => {
  try {
    const historial = await VehiculoService.getHistorial(req.params.id, req.user.id);
    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registrarEnvio = async (req, res) => {
  try {
    const id = await VehiculoService.registrarEnvio(req.body, req.user.id);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const liquidarEnvio = async (req, res) => {
  try {
    await VehiculoService.liquidarEnvio(req.body, req.user.id);
    res.json({ message: 'Envío liquidado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEnviosActivos = async (req, res) => {
  try {
    const envios = await VehiculoService.getEnviosActivos(req.params.jornadaId, req.user.id);
    res.json(envios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  getHistorial,
  registrarEnvio,
  liquidarEnvio,
  getEnviosActivos
};
