const config = require("../config/config");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
    config.DB_DATABASE,
    config.DB_USERNAME,
    config.DB_PASSWORD,
    {dialect: "mssql", host: config.DB_SERVER, dialectOptions: {encrypt: config.DB_ENCRYPT}}
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Define models/tables
db.Org = require("./Org")(sequelize, Sequelize);
db.Key = require("./Key")(sequelize, Sequelize);
db.TokenStore = require("./TokenStore")(sequelize, Sequelize);
db.UnSyncedData = require("./UnSyncedData")(sequelize, Sequelize);
db.UsageDetail = require("./UsageDetail")(sequelize, Sequelize);
db.User = require("./User")(sequelize, Sequelize);

// Define relationships
// db.Org.hasMany(db.User);
// db.Org.hasMany(db.Key);
// db.Org.hasMany(db.TokenStore);
// db.Org.hasMany(db.UsageDetail);
// db.Org.hasMany(db.UnSyncedData);

// db.User.belongsTo(db.Org);
// db.Key.belongsTo(db.Org);
// db.TokenStore.belongsTo(db.Org);
// db.UsageDetail.belongsTo(db.Org);
// db.UnSyncedData.belongsTo(db.Org);

//removing user id as primary as same user can be used between sandbox and production
//db.User.hasMany(db.TokenStore);
//db.User.hasMany(db.Key);
//db.User.hasMany(db.UnSyncedData);
//db.User.hasMany(db.UsageDetail);

//db.Key.belongsTo(db.User);
//db.UnSyncedData.belongsTo(db.User);
//db.UsageDetail.belongsTo(db.User);

// sequelize.sync()
//   .then((result) => {
//     console.log("#######", result);
//   });


module.exports = db;