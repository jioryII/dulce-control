const ProductService = require('./product.service');

const getAll = async (req, res) => {
  try {
    const products = await ProductService.getAll(req.user.id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

const create = async (req, res) => {
  try {
    const id = await ProductService.create(req.body, req.user.id);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

const update = async (req, res) => {
  try {
    await ProductService.update(req.params.id, req.body, req.user.id);
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

const remove = async (req, res) => {
  try {
    await ProductService.delete(req.params.id, req.user.id);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

module.exports = { getAll, create, update, remove };
