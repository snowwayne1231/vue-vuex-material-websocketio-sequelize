'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordMove extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecordMove.belongsTo(models.User, {
        foreignKey: 'userId',
      });
      RecordMove.belongsTo(models.Map, {
        foreignKey: 'fromMapId',
      });
      RecordMove.belongsTo(models.Map, {
        foreignKey: 'toMapId',
      });
    }
  }
  RecordMove.init({
    round: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    fromMapId: DataTypes.INTEGER,
    toMapId: DataTypes.INTEGER,
    spendPoint: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'RecordMove',
  });
  return RecordMove;
};