'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PacketItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PacketItem.belongsTo(models.User, {
        foreignKey: 'userId',
      });
      PacketItem.belongsTo(models.Item, {
        foreignKey: 'itemId',
      });
    }
  }
  PacketItem.init({
    userId: DataTypes.INTEGER,
    itemId: DataTypes.INTEGER,
    timestampDeadline: DataTypes.DATE,
    timestampUse: DataTypes.DATE,
    userTarget: DataTypes.STRING,
    status: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'PacketItem',
  });
  return PacketItem;
};