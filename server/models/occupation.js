'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Occupation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Occupation.init({
    name: DataTypes.STRING,
    contributionCondi: DataTypes.INTEGER,
    addActPoint: DataTypes.INTEGER,
    addPeopleLimit: DataTypes.INTEGER,
    isAllowedItem: DataTypes.BOOLEAN,
    isAllowedRecurit: DataTypes.BOOLEAN,
    isAllowedShare: DataTypes.BOOLEAN,
    isAllowedPk: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Occupation',
  });
  return Occupation;
};