'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Map extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Map.belongsTo(models.City, {
        foreignKey: 'cityId',
      });
      Map.belongsTo(models.Adventure, {
        foreignKey: 'adventureId',
      });
      Map.belongsTo(models.Country, {
        foreignKey: 'ownCountryId',
      });
    }
  }
  Map.init({
    name: DataTypes.STRING,
    position: DataTypes.STRING,
    x: DataTypes.INTEGER,
    y: DataTypes.INTEGER,
    route: DataTypes.STRING,
    cityId: DataTypes.INTEGER,
    adventureId: DataTypes.INTEGER,
    state: DataTypes.INTEGER,
    isAllowedWalk: DataTypes.BOOLEAN,
    ownCountryId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Map',
  });
  return Map;
};