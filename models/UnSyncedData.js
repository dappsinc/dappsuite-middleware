/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('UnSyncedData', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		userId: {
			type: DataTypes.STRING,
			allowNull: true
		},
		isSynced: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: '0'
		},
		transactionId: {
			type: DataTypes.STRING,
			allowNull: true
		},
		errorDetails: {
			type: DataTypes.STRING,
			allowNull: true
		},
		jsonObject: {
			type: DataTypes.STRING,
			allowNull: true
		},
		orgId: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'UnSyncedData',
		timestamps: true,
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	});
};
