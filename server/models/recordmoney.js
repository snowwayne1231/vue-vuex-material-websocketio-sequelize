'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordMoney extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecordMoney.belongsTo(models.User, {
        foreignKey: 'userId',
      });
      RecordMoney.belongsTo(models.User, {
        foreignKey: 'giveUserId',
      });
      RecordMoney.belongsTo(models.User, {
        foreignKey: 'giveCityId',
      });
    }
  }
  RecordMoney.init({
    userId: DataTypes.INTEGER,
    giveUserId: DataTypes.INTEGER,
    giveCityId: DataTypes.INTEGER,
    reason: DataTypes.STRING,
    round: DataTypes.INTEGER,
    money: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'RecordMoney',
  });
  return RecordMoney;
};