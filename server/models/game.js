'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    
    static associate(models) {
      
    }
  };
  Game.init({
    type: {
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
    },
    b1v1: {
      type: DataTypes.BOOLEAN,
    },
    b2v2: {
      type: DataTypes.BOOLEAN,
    },
    b3v3: {
      type: DataTypes.BOOLEAN,
    },
    b4v4: {
      type: DataTypes.BOOLEAN,
    },
    b1v2: {
      type: DataTypes.BOOLEAN,
    },
    b1v3: {
      type: DataTypes.BOOLEAN,
    },
    b1v4: {
      type: DataTypes.BOOLEAN,
    },
    b2v3: {
      type: DataTypes.BOOLEAN,
    },
    b2v4: {
      type: DataTypes.BOOLEAN,
    },
    b3v4: {
      type: DataTypes.BOOLEAN,
    }
  }, {
    sequelize,
    modelName: 'Game',
  });
  
  return Game;
};