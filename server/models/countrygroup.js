'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CountryGroup extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CountryGroup.belongsTo(models.Country, {
        foreignKey: 'masterCountryId'
      });
      CountryGroup.belongsTo(models.Country, {
        foreignKey: 'followerCountryId'
      });
    }
  }
  CountryGroup.init({
    masterCountryId: DataTypes.INTEGER,
    followerCountryId: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    timestampStart: DataTypes.DATE,
    timestampEnd: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'CountryGroup',
  });
  return CountryGroup;
};