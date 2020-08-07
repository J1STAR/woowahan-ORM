const { Model, DataTypes } = require("./model");
const mysql = require("mysql2/promise");

module.exports = ({ host, user, password, database }, options) => {
  const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  Model.createConnection(pool, options);
  console.log(`WoowaORM: Database connected`);
};

module.exports.Model = Model;
module.exports.DataTypes = DataTypes;
