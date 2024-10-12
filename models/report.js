"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A report belongs to a course (One-to-Many)
      Report.belongsTo(models.Course, {
        foreignKey: "course_id",
        as: "course", // Alias to reference the course this report belongs to
      });
    }
  }
  Report.init(
    {
      course_id: DataTypes.INTEGER,
      student_count: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Report",
    },
  );
  return Report;
};
