'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordEvent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecordEvent.belongsTo(models.Event, {
        foreignKey: 'eventId',
      });
    }
  }
  RecordEvent.init({
    round: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER,
    timestamp: DataTypes.DATE,
    detail: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'RecordEvent',
  });
  return RecordEvent;
};