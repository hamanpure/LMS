"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class QuizOption extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A quiz option belongs to a quiz question (Many-to-One)
      QuizOption.belongsTo(models.QuizQuestion, {
        foreignKey: "quiz_question_id",
        as: "question", // Alias to reference the question this option belongs to
      });

      // A quiz option can be selected by many students as an answer (One-to-Many)
      QuizOption.hasMany(models.QuizAnswer, {
        foreignKey: "selected_option_id",
        as: "selectedAnswers", // Alias to access the answers where this option was selected
      });
    }
  }
  QuizOption.init(
    {
      quiz_question_id: DataTypes.INTEGER,
      option_text: DataTypes.STRING,
      is_correct: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "QuizOption",
    }
  );
  return QuizOption;
};
