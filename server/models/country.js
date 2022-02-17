'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Country extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.City.hasOne(Country, {
        foreignKey: 'originCityId',
      });
    }
  }
  Country.init({
    name: DataTypes.STRING,
    sign: DataTypes.STRING,
    money: DataTypes.DOUBLE,
    peopleMax: DataTypes.INTEGER,
    color: DataTypes.STRING,
    originCityId: DataTypes.INTEGER,

  }, {
    sequelize,
    modelName: 'Country',
  });
  return Country;
};