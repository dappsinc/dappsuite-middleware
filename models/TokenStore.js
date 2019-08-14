/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('TokenStore', {
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
		accessToken: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		refreshToken: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		orgId: {
			type: DataTypes.STRING,
			allowNull: true
		},
		oauth: {
			type: DataTypes.TEXT,
			allowNull: true,
			
		}
	}, {
		tableName: 'TokenStore',
		timestamps: true,
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	});
};
