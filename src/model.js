const queryGenerator = require("./query-generators");
const DataTypes = require("./data-types");

class Model {
  static defaultAttributes = {
    id: { dataType: DataTypes.INTEGER },
    isDeleted: { dataType: DataTypes.BOOLEAN },
    createdAt: { dataType: DataTypes.TIMESTAMP },
    updatedAt: { dataType: DataTypes.TIMESTAMP },
  };

  static createConnection(pool, options) {
    this.pool = pool;
    this.options = options;
  }

  static create400Error = (message) => {
    const err = new Error(message);
    err.status = 400;
    return err;
  };

  static validationError = (attribute) =>
    this.create400Error(`The value for ${attribute} is invalid.`);

  /**
   * @param {Record<string, { dataType: string, required: boolean, defaultValue: unknown }>} attributes
   */
  static init = function (attributes, defaultWhere = {}) {
    if (!attributes) {
      throw this.create400Error("attributes not given for a model");
    }

    this.attributes = attributes;
    this.defaultWhere = { ...defaultWhere, isDeleted: 0 };
    this.start();
  };

  static start = async function () {
    if (this.options) {
      if (this.options.sync?.force) await this.dropTable();
      if (this.options.sync) await this.createTable();
    }
  };

  static createTable = async function () {
    const createTableQuery = queryGenerator.generateCreateTableQueryStmt(
      this.name,
      this.attributes
    );
    await this.pool.query(createTableQuery);
    console.log(`WoowaORM: Table ${this.name} Created.`);
  };

  static dropTable = async function () {
    const dropTableQuery = queryGenerator.generateDropTableQueryStmt(this.name);
    await this.pool.query(dropTableQuery);
    console.log(`WoowaORM: Table ${this.name} Dropped.`);
  };

  static validate = function (input) {
    const validatedInput = {};
    const attributes = { ...this.attributes, ...this.defaultAttributes };
    for (const [name, value] of Object.entries(input)) {
      // console.log(name, value)
      if (!attributes[name] || value === undefined) {
        continue;
      }
      switch (attributes[name].dataType) {
        case DataTypes.BOOLEAN:
          if (value == 0 || value == 1) validatedInput[name] = value;
          else throw this.validationError(name);
          break;
        case DataTypes.INTEGER:
          if (typeof value === "number" || !isNaN(Number(value))) {
            validatedInput[name] = value;
          } else throw this.validationError(name);
          break;
        case DataTypes.DATETIME:
        case DataTypes.DATE:
        case DataTypes.TIMESTAMP:
          if (!isNaN(Date.parse(value))) validatedInput[name] = `'${value}'`;
          break;
        case DataTypes.STRING:
        case DataTypes.TEXT:
          validatedInput[name] = `'${value}'`;
          break;
        default:
          throw this.validationError(name);
      }
    }
    return validatedInput;
  };

  static findOne = async function (
    params = {
      attributes: "*",
      where: {},
      rawWhere: undefined,
      sortBy: undefined,
    }
  ) {
    const validatedWhere = this.validate({
      ...params.where,
      ...this.defaultWhere,
    });

    const queryStmt = queryGenerator.generateFindQueryStmt({
      tableName: this.name,
      isOne: true,
      attributes: params.attributes,
      where: validatedWhere,
      rawWhere: params.rawWhere,
      sortBy: params.sortBy,
    });

    return (await this.pool.query(queryStmt))[0][0];
  };

  static findAll = async function (
    params = {
      attributes: "*",
      where: {},
      rawWhere: undefined,
      sortBy: undefined,
    }
  ) {
    const validatedWhere = this.validate({
      ...params.where,
      ...this.defaultWhere,
    });

    const queryStmt = queryGenerator.generateFindQueryStmt({
      tableName: this.name,
      isOne: false,
      attributes: params.attributes,
      where: validatedWhere,
      rawWhere: params.rawWhere,
      sortBy: params.sortBy,
    });

    return (await this.pool.query(queryStmt))[0];
  };

  static create = async function (input) {
    const validatedInput = this.validate(input);
    const queryStmt = queryGenerator.generateCreateQueryStmt(validatedInput);

    return {
      id: (await this.pool.query(queryStmt))[0].insertId,
      ...input,
    };
  };

  static update = async function (input) {
    if (!input.id) throw this.validationError("id");
    const validatedInput = this.validate(input);
    const queryStmt = queryGenerator.generateUpdateQueryStmt(validatedInput);
    return await this.pool.query(queryStmt);
  };

  static delete = async function (id) {
    if (!id) throw this.validationError("id");
    const queryStmt = queryGenerator.generateDeleteQueryStmt(id);
    return await this.pool.query(queryStmt);
  };
}

module.exports = { Model, DataTypes };
