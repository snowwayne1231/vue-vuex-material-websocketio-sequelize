'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RecordWar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecordWar.belongsTo(models.Country, {
        foreignKey: 'defenceCountryId',
      });
      RecordWar.belongsTo(models.Country, {
        foreignKey: 'winnerCountryId',
      });
      RecordWar.belongsTo(models.Map, {
        foreignKey: 'mapId',
      });
      RecordWar.belongsTo(models.User, {
        foreignKey: 'judgeId',
      });
    }
  }
  RecordWar.init({
    attackCountryIds: {
      type: DataTypes.TEXT,
      get() {
        const val = this.getDataValue('attackCountryIds');
        return val && val[0] == '[' ? JSON.parse(val) : val;
      },
      set(val) {
        this.setDataValue('attackCountryIds', typeof val != 'string' ? JSON.stringify(val) : val);
      }
    },
    defenceCountryId: DataTypes.INTEGER,
    winnerCountryId: DataTypes.INTEGER,
    mapId: DataTypes.INTEGER,
    judgeId: DataTypes.INTEGER,
    toolmanId: DataTypes.INTEGER,
    atkUserIds: {
      type: DataTypes.STRING,
      get() {
        let val = this.getDataValue('atkUserIds');
        return val && val[0] == '[' ? JSON.parse(val) : val;
      },
      set(val) {
        this.setDataValue('atkUserIds', typeof val != 'string' ? JSON.stringify(val) : val);
      }
    },
    defUserIds: {
      type: DataTypes.STRING,
      get() {
        const val = this.getDataValue('defUserIds');
        return val && val[0] == '[' ? JSON.parse(val) : val;
      },
      set(val) {
        this.setDataValue('defUserIds', typeof val != 'string' ? JSON.stringify(val) : val);
      }
    },
    timestamp: DataTypes.DATE,
    round: DataTypes.INTEGER,
    detail: {
      type: DataTypes.TEXT,
      get() {
        const val = this.getDataValue('detail');
        return val && val[0] == '{' ? JSON.parse(val) : val;
      },
      set(val) {
        this.setDataValue('detail', typeof val != 'string' ? JSON.stringify(val) : val);
      }
    }
  }, {
    sequelize,
    modelName: 'RecordWar',
  });
  return RecordWar;
};