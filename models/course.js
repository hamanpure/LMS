"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A course belongs to an educator
      Course.belongsTo(models.User, {
        foreignKey: "educator_id",
        as: "educator",
      });

      // A course can have many students through enrollments
      Course.belongsToMany(models.User, {
        through: models.Enrollment,
        foreignKey: "course_id",
        as: "students", // Alias for the students enrolled in the course
      });

      // A course can have many chapters
      Course.hasMany(models.Chapter, {
        foreignKey: "course_id",
        as: "chapters",
      });

      // A course can have many reports
      Course.hasMany(models.Report, {
        foreignKey: "course_id",
        as: "reports", // Alias to access all reports for this course
      });
    }
  }
  Course.init(
    {
      educator_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Course",
    }
  );
  return Course;
};
