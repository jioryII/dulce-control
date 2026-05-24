require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES
  },
  frontendUrl: process.env.FRONTEND_URL
};
