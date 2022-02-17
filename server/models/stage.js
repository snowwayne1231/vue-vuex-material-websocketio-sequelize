'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Stage.init({
    round: DataTypes.INTEGER,
    warIds: DataTypes.TEXT,
    userDetail: DataTypes.TEXT,
    countryDetail: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Stage',
  });
  return Stage;
};