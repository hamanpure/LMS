"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Progress extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Progress belongs to a student (User with role 'student')
      Progress.belongsTo(models.User, {
        foreignKey: "student_id",
        as: "student", // Alias for the student in the progress entry
      });

      // Progress belongs to a page
      Progress.belongsTo(models.Page, {
        foreignKey: "page_id",
        as: "page", // Alias for the page that is being marked as complete
      });
    }
  }
  Progress.init(
    {
      student_id: DataTypes.INTEGER,
      page_id: DataTypes.INTEGER,
      completed: DataTypes.BOOLEAN
    },
    {
      sequelize,
      modelName: "Progress",
    }
  );
  return Progress;
};
