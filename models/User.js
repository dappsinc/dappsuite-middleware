/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('User', {
		srno: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		firstName: {
			type: DataTypes.STRING,
			allowNull: true
		},
		lastName: {
			type: DataTypes.STRING,
			allowNull: true
		},
		id: {
			type: DataTypes.STRING,
			allowNull: false
		},
		orgId: {
			type: DataTypes.STRING,
			allowNull: true,
			references: {
				model: 'Org',
				key: 'id'
			}
		},
		username: {
			type: DataTypes.STRING,
			allowNull: true
		},
		nickName: {
			type: DataTypes.STRING,
			allowNull: true
		},
		displayName: {
			type: DataTypes.STRING,
			allowNull: true
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true
		},
		addressStreet: {
			type: DataTypes.STRING,
			allowNull: true
		},
		addressCity: {
			type: DataTypes.STRING,
			allowNull: true
		},
		addressState: {
			type: DataTypes.STRING,
			allowNull: true
		},
		addressCountry: {
			type: DataTypes.STRING,
			allowNull: true
		},
		addressZip: {
			type: DataTypes.STRING,
			allowNull: true
		},
		mobile: {
			type: DataTypes.STRING,
			allowNull: true
		},
		comments: {
			type: DataTypes.STRING,
			allowNull: true
		},
		userType: {
			type: DataTypes.STRING,
			allowNull: true
		},
		utcOffset: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: '1'
		}
	}, {
		tableName: 'User',
		timestamps: true,
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	});
};
