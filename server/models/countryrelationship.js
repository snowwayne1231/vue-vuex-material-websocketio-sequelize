'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CountryRelationship extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CountryRelationship.belongsTo(models.Country, {
        foreignKey: 'aCountryId'
      });
      CountryRelationship.belongsTo(models.Country, {
        foreignKey: 'bCountryId'
      });
    }
  }
  CountryRelationship.init({
    aCountryId: DataTypes.INTEGER,
    bCountryId: DataTypes.INTEGER,
    value: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'CountryRelationship',
  });
  return CountryRelationship;
};