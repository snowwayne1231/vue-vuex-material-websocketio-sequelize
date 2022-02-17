'use strict';
const Xsize = 40;
const Ysize = 40;





const allowdWalkPositions = [
  [1,3,5,7],
  [1,3,5,7],
]


function getAllowedByPosition(x, y) {
  let yline = allowdWalkPositions[y];
  if (yline) {
    let idx = yline.indexOf(x);
    if (idx >= 0) {
      return true
    }
  }
  return false;
}


module.exports = {
  async up (queryInterface, Sequelize) {
    let insertData = [];
    const template = {
      createdAt: new Date(),
      updatedAt: new Date(),
      ownCountryId: 0,
      isAllowedWalk: false,
      state: 1,
      adventureId: 0,
      cityId: 0,
      route: '',
      position: [0, 0],
    };

    const maps = await queryInterface.rawSelect('Maps', {}, ['id']);
    if (maps) { return false; }
    

    for (var y = 0; y < Ysize; y++) {
      for (var x = 0; x < Xsize; x++) {
        let loc = {...template};
        loc.position = [x, y];
        loc.isAllowedWalk = getAllowedByPosition(x, y);
        insertData.push(loc);
      }
    }

    await queryInterface.bulkInsert('Maps', insertData);

    const maps = await queryInterface.rawSelect('Maps', {plain: false}, ['id', 'isAllowedWalk', 'position', 'route']);
    const _hash = {};
    maps.map(m => {
      _hash[m.id] = m;
    });
    
    return queryInterface.bulkInsert('Maps', insertData);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Maps', null, {truncate: true, cascade: true, restartIdentity: true});
  }
};
