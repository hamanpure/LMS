"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class QuizQuestion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A quiz question belongs to a quiz (Many-to-One)
      QuizQuestion.belongsTo(models.Quiz, {
        foreignKey: "quiz_id",
        as: "quiz", // Alias to reference the quiz this question belongs to
      });

      // A quiz question has many answer options (One-to-Many)
      QuizQuestion.hasMany(models.QuizOption, {
        foreignKey: "quiz_question_id",
        as: "options", // Alias to reference the options for this question
      });

      // A quiz question has many student answers (One-to-Many)
      QuizQuestion.hasMany(models.QuizAnswer, {
        foreignKey: "quiz_question_id",
        as: "answers", // Alias to reference the answers given by students for this question
      });
    }
  }
  QuizQuestion.init(
    {
      quiz_id: DataTypes.INTEGER,
      question: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "QuizQuestion",
    }
  );
  return QuizQuestion;
};
