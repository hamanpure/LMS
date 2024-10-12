"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // An enrollment connects a student to a course (Many-to-Many relationship)
      Enrollment.belongsTo(models.User, {
        foreignKey: "student_id",
      });

      Enrollment.belongsTo(models.Course, {
        foreignKey: "course_id",
      });
    }
  }
  Enrollment.init(
    {
      student_id: DataTypes.INTEGER,
      course_id: DataTypes.INTEGER,
      enrolled_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Enrollment",
    },
  );
  return Enrollment;
};
