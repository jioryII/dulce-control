const ClienteService = require('./clientes.service');

const getAll = async (req, res) => {
  try {
    const clientes = await ClienteService.getAll(req.user.id);
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const cliente = await ClienteService.getById(req.params.id, req.user.id);
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const id = await ClienteService.create(req.body, req.user.id);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    await ClienteService.update(req.params.id, req.body, req.user.id);
    res.json({ message: 'Cliente actualizado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await ClienteService.delete(req.params.id, req.user.id);
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
