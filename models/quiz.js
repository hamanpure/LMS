"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Quiz extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A quiz belongs to a chapter (One-to-Many)
      Quiz.belongsTo(models.Chapter, {
        foreignKey: "chapter_id",
        as: "chapter", // Alias to reference the chapter this quiz belongs to
      });

      // A quiz has many questions (One-to-Many)
      Quiz.hasMany(models.QuizQuestion, {
        foreignKey: "quiz_id",
        as: "questions", // Alias to reference the questions in this quiz
      });
    }
  }
  Quiz.init(
    {
      chapter_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Quiz",
    },
  );
  return Quiz;
};
