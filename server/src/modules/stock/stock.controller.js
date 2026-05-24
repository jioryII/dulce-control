const StockService = require('./stock.service');

const getByJornada = async (req, res) => {
  try {
    const stock = await StockService.getStockActual(req.params.jornadaId);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBajoStock = async (req, res) => {
  try {
    const stock = await StockService.getBajoStock();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getByJornada,
  getBajoStock
};
