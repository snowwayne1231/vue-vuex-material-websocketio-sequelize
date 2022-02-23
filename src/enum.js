
module.exports = {
    AUTHORIZE: 'AUTHORIZE',
    MESSAGE: 'MESSAGE',
    FAILED: 'FAILED',
    ACT_GET_GLOBAL_USERS_INFO: 11,
    ACT_GET_GLOBAL_DATA: 12,
    ACT_GET_GLOBAL_CHANGE_DATA: 13,
    UserGlobalAttributes: ['id', 'code', 'nickname', 'countryId', 'loyalty', 'contribution', 'occupationId', 'role', 'mapNowId', 'soldier', 'captiveDate'],
    MapsGlobalAttributes: ['id', 'name', 'x', 'y', 'route', 'cityId', 'ownCountryId'],
    CityGlobalAttributes: ['id', 'money', 'addResource', 'timeBeAttacked', 'jsonConstruction'],
    CountryGlobalAttributes: ['id', 'name', 'money', 'emperorId', 'peopleMax', 'color', 'originCityId'],
}