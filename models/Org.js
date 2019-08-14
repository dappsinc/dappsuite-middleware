/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Org', {
		srno: {
			type: DataTypes.INTEGER,
			allowNull: true			
		},
		name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		information: {
			type: DataTypes.STRING,
			allowNull: true
		},
		comments: {
			type: DataTypes.STRING,
			allowNull: true
		},
		id: {
			type: DataTypes.STRING,
			allowNull: false,
			primaryKey: true
		},
		instanceUrl: {
			type: DataTypes.STRING,
			allowNull: true
		},
		environment: {
			type: DataTypes.STRING,
			allowNull: true
		},
		ethNodeServerUrl: {
			type: DataTypes.STRING,
			allowNull: true
		},
		ethGethNode: {
			type: DataTypes.STRING,
			allowNull: true
		},
		nodeServerUsername: {
			type: DataTypes.STRING,
			allowNull: true
		},
		nodeServerPassword: {
			type: DataTypes.STRING,
			allowNull: true
		},
		orgType: {
			type: DataTypes.STRING,
			allowNull: true
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: '1'
		},
		apiVersion: {
			type: DataTypes.STRING,
			allowNull: true
		},
		secretKey: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'Org',
		timestamps: true,
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	});
};
