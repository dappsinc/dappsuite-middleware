/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('UsageDetail', {
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
		orgId: {
			type: DataTypes.STRING,
			allowNull: true
		},
		blockhainType: {
			type: DataTypes.STRING,
			allowNull: true
		},
		gasUsed: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		totalEtherUsed: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		information: {
			type: DataTypes.STRING,
			allowNull: true
		},
		transactionId: {
			type: DataTypes.STRING,
			allowNull: true
		},
		jsonObject: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		totalAmountCharged: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
	}, {
		tableName: 'UsageDetail',
		timestamps: true,
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	});
};
