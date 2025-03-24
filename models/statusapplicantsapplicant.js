'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StatusApplicantsApplicant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  StatusApplicantsApplicant.init({
    pmb: {
      type: DataTypes.INTEGER,
      unique: false,
      allowNull: false,
    },
    identityUser: {
      type: DataTypes.STRING(50),
      unique: false,
      allowNull: false,
      field: 'identity_user'
    },
    date: {
      type: DataTypes.DATEONLY,
      unique: false,
      allowNull: false,
    },
    session: {
      type: DataTypes.INTEGER,
      unique: false,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      unique: false,
      allowNull: true,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      unique: false,
      allowNull: true,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'StatusApplicantsApplicant',
    tableName: 'status_applicants_applicant',
    freezeTableName: true,
  });
  return StatusApplicantsApplicant;
};