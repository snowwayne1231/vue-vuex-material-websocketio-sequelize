'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordApi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecordApi.belongsTo(models.User, {
        foreignKey: 'userId',
      });
    }
  }
  RecordApi.init({
    userId: DataTypes.INTEGER,
    model: DataTypes.STRING,
    payload: DataTypes.STRING,
    curd: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'RecordApi',
  });
  return RecordApi;
};