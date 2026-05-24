const ReportesService = require('./reportes.service');

const getVentas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const data = await ReportesService.getVentas(desde, hasta);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProduccion = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const data = await ReportesService.getProduccion(desde, hasta);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCierresCaja = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const data = await ReportesService.getCierresCaja(desde, hasta);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockCritico = async (req, res) => {
  try {
    const data = await ReportesService.getStockCritico();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVentas,
  getProduccion,
  getCierresCaja,
  getStockCritico
};
