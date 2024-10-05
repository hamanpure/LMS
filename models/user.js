"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // If the user is an educator, they can have many courses
      User.hasMany(models.Course, {
        foreignKey: "educator_id",
        as: "courses", // Alias to access educator's courses
      });

      // If the user is a student, they can enroll in many courses
      User.belongsToMany(models.Course, {
        through: models.Enrollment, // Many-to-many relationship via the Enrollment table
        foreignKey: "student_id",
        as: "enrolledCourses", // Alias for student's enrolled courses
      });

      // A student can have many quiz answers (tracked by the QuizAnswer table)
      User.hasMany(models.QuizAnswer, {
        foreignKey: "student_id",
        as: "quizAnswers", // Alias to access student's quiz answers
      });

      User.hasMany(models.Progress, {
        foreignKey: 'student_id',
        as: 'progressEntries',  // Alias to access the student's progress entries
      });
      
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
