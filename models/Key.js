/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Key', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		orgId: {
			type: DataTypes.STRING,
			allowNull: true
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false,
			primaryKey: true
		},
		addressType: {
			type: DataTypes.STRING,
			allowNull: true
		},
		userId: {
			type: DataTypes.STRING,
			allowNull: true
		},
		isActive: {
			type: DataTypes.BOOLEAN,
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
		addressDetailsJson: {
			type: DataTypes.STRING(1200),
			allowNull: true
		},
		deployedOnVM: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'Key',
		timestamps: true,
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	});
};
