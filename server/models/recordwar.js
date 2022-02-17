'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordWar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecordWar.belongsTo(models.Country, {
        foreignKey: 'defenceCountryId',
      });
      RecordWar.belongsTo(models.Country, {
        foreignKey: 'winnerCountryId',
      });
      RecordWar.belongsTo(models.Map, {
        foreignKey: 'mapId',
      });
      RecordWar.belongsTo(models.User, {
        foreignKey: 'judgeId',
      });
    }
  }
  RecordWar.init({
    attackCountryIds: DataTypes.TEXT,
    defenceCountryId: DataTypes.INTEGER,
    winnerCountryId: DataTypes.INTEGER,
    mapId: DataTypes.INTEGER,
    judgeId: DataTypes.INTEGER,
    timestamp: DataTypes.DATE,
    round: DataTypes.INTEGER,
    detail: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'RecordWar',
  });
  return RecordWar;
};