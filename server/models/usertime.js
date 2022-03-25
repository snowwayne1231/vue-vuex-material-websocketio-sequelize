'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserTime extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.User.hasMany(UserTime, {
        foreignKey: 'userId',
      });
    }
  };
  UserTime.init({
    utype: {
      type: DataTypes.INTEGER,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
    before: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    after: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    timestamp: {
      type: DataTypes.DATE,
    }
  }, {
    sequelize,
    modelName: 'UserTime',
  });
  
  return UserTime;
};