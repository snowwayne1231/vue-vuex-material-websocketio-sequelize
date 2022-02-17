const AdminBro = require('admin-bro');
const AdminBroExpress = require('@admin-bro/express');
const AdminBroSequelize = require('@admin-bro/sequelize');
const md5 =require("md5");

AdminBro.registerAdapter(AdminBroSequelize);

const express = require('express');
const app = express();

const db = require('./models');

const adminBro = new AdminBro({
  databases: [db],
  rootPath: '/admin',
  branding: {
    companyName: 'Company Of Welfare',
  },
  resources: [
    {
      resource: db.User,
      options: {
        properties: {
          nickname: {isTitle: true},
        },
        listProperties: ['id', 'nickname', 'code', 'nameEn', 'countryId', 'actPoint', 'money'],
        filterProperties: ['id', 'code', 'nickname', 'nameEn', 'countryId'],
      },
    },
    {
      resource: db.Map,
      options: {
        properties: {
          position: {isTitle: true},
        },
      },
    },
  ],
});


module.exports = {
  useAdminRouter: function(app) {
    const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
      authenticate: async (email, password) => {
        const md5pwd = md5(password);
        const user = await db.Admin.findOne({ where: { code: email, pwd: md5pwd }});
        if (user) {
          return true;
        }
        return false;
      },
    });
    app.use(adminBro.options.rootPath, router);
    return router;
  },
  useAdminRouterDev: function(app) {
    const router = AdminBroExpress.buildRouter(adminBro);
    app.use(adminBro.options.rootPath, router);
  }
}
