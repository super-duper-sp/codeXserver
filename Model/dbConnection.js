const dbConfig = require('../Config/db.config');
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
  
});

const db = {};

// Add Sequelize and sequelize instances to the db object
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./user.model.js")(sequelize, Sequelize);


// Define relationships
// db.User.hasMany(db.Project, { foreignKey: 'user_id', onDelete: 'CASCADE' });
// db.User.hasMany(db.Task, { foreignKey: 'user_id', onDelete: 'CASCADE' });


module.exports = db;
