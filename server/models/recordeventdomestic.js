'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordEventDomestic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecordEventDomestic.belongsTo(models.Event, {
        foreignKey: 'eventId',
      });
      RecordEventDomestic.belongsTo(models.Country, {
        foreignKey: 'countryId',
      });
    }
  }
  RecordEventDomestic.init({
    round: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER,
    countryId: DataTypes.INTEGER,
    timestamp: DataTypes.DATE,
    detail: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'RecordEventDomestic',
  });
  return RecordEventDomestic;
};