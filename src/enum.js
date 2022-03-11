
module.exports = {
    AUTHORIZE: 'AUTHORIZE',
    MESSAGE: 'MESSAGE',
    FAILED: 'FAILED',
    ALERT: 'ALERT',
    ROLE_EMPEROR: 1,
    ROLE_GENERMAN: 2,
    ROLE_FREEMAN: 3,
    TYPE_CITY: 1,
    TYPE_WILD: 2,
    ACT_GET_GLOBAL_USERS_INFO: 11,
    ACT_GET_GLOBAL_DATA: 12,
    ACT_GET_GLOBAL_CHANGE_DATA: 13,
    ACT_MOVE: 14,
    ACT_LEAVE_COUNTRY: 15,
    ACT_ENTER_COUNTRY: 16,
    ACT_SEARCH_WILD: 17,
    ACT_INCREASE_SOLDIER: 18,
    ACT_NOTIFICATION: 19,
    ACT_BATTLE: 20,
    ACT_BATTLE_ADD: 21,
    ACT_BATTLE_DONE: 22,
    ACT_BATTLE_JOIN: 23,
    ACT_BATTLE_JUDGE: 24,
    UserGlobalAttributes: ['id', 'code', 'nickname', 'countryId', 'loyalty', 'loyalUserId', 'contribution', 'occupationId', 'role', 'mapNowId', 'soldier', 'captiveDate'],
    MapsGlobalAttributes: ['id', 'name', 'x', 'y', 'route', 'cityId', 'ownCountryId'],
    CityGlobalAttributes: ['id', 'money', 'addResource', 'timeBeAttacked', 'jsonConstruction'],
    CountryGlobalAttributes: ['id', 'name', 'money', 'emperorId', 'peopleMax', 'color', 'originCityId'],
    EVENT_LEAVE_COUNTRY: '_LEAVE_COUNTRY_',
    EVENT_ENTER_COUNTRY: "_ENTER_COUNTRY_",
    EVENT_WAR: "_WAR_",
    EVENT_WAR_WIN: "_WAR_WIN_",
    EVENT_DEFENCE: "_WAR_DEFENCE_",
    EVENT_WAR_WILD: "_WAR_WILD_",
    EVENT_WAR_CITY: "_WAR_CITY_",
    EVENT_CREATE_COUNTRY: "_CREATE_COUNTRY_",
    EVENT_CHAOS: "_CHAOS_",
    EVENT_DESTROY_COUNTRY: "_DESTROY_COUNTRY_",
    EVENT_GROUP_UP: "_GROUP_UP_",
    EVENT_COUNTRY_RELATIONSHIP: "_COUNTRY_RELATIONSHIP_",
    EVENT_OCCUPATION: "_OCCUPATION_",
    ADMIN_AUTHORIZE: 999,
    ADMIN_CONTROL: 'ADMINCTL'
}