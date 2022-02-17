'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordLogin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RecordLogin.init({
    userId: DataTypes.INTEGER,
    timestamp: DataTypes.DATE,
    ip: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'RecordLogin',
  });
  return RecordLogin;
};