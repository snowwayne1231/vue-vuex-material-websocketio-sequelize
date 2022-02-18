'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Country.hasMany(User, {
        foreignKey: 'countryId',
      });
      User.hasOne(User, {
        foreignKey: 'loyalUserId',
      });
      models.Occupation.hasOne(User, {
        foreignKey: 'occupationId',
      });
      models.Map.hasOne(User, {
        foreignKey: 'mapTargetId',
      });
      models.Map.hasOne(User, {
        foreignKey: 'mapNowId',
      });
      models.Map.hasOne(User, {
        foreignKey: 'mapNextId',
      });
    }
  };
  User.init({
    nameZh: DataTypes.STRING,
    nameEn: DataTypes.STRING,
    nickname: DataTypes.STRING,
    code: DataTypes.STRING,
    pwd: DataTypes.STRING,
    countryId: DataTypes.INTEGER,
    loyalUserId: DataTypes.INTEGER,
    loyalty: DataTypes.INTEGER,
    contribution: DataTypes.INTEGER,
    occupationId: DataTypes.INTEGER,
    role: DataTypes.INTEGER,        // 1 = 君主, 2 = 武將, 3 = 浪人, 4 = 俘虜
    money: DataTypes.INTEGER,
    actPoint: DataTypes.INTEGER,
    actPointMax: DataTypes.INTEGER,
    mapTargetId: DataTypes.INTEGER,
    mapNowId: DataTypes.INTEGER,
    mapNextId: DataTypes.INTEGER,
    mapPathIds: DataTypes.TEXT,
    destoryByCountryIds: DataTypes.TEXT,
    soldier: DataTypes.INTEGER,
    captiveDate: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'User',
  });
  
  return User;
};