"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class QuizAnswer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A quiz answer belongs to a student
      QuizAnswer.belongsTo(models.User, {
        foreignKey: "student_id",
        as: "student",
      });

      // A quiz answer belongs to a question
      QuizAnswer.belongsTo(models.QuizQuestion, {
        foreignKey: "quiz_question_id",
        as: "question",
      });

      // A quiz answer references the selected option
      QuizAnswer.belongsTo(models.QuizOption, {
        foreignKey: "selected_option_id",
        as: "selectedOption",
      });
    }
  }
  QuizAnswer.init(
    {
      student_id: DataTypes.INTEGER,
      quiz_question_id: DataTypes.INTEGER,
      selected_option_id: DataTypes.INTEGER,
      is_correct: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "QuizAnswer",
    },
  );
  return QuizAnswer;
};
