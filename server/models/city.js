'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Country.hasMany(City, {
        foreignKey: 'ownCountryId',
      });
    }
  }
  City.init({
    name: DataTypes.STRING,
    money: DataTypes.DOUBLE,
    ownCountryId: DataTypes.INTEGER,
    addResource: DataTypes.INTEGER,
    timeBeAttacked: DataTypes.STRING,
    jsonConstruction: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'City',
  });
  return City;
};