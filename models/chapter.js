"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A chapter belongs to a course (One-to-Many)
      Chapter.belongsTo(models.Course, {
        foreignKey: "course_id",
        as: "course", // Alias to reference the course this chapter belongs to
      });

      // A chapter has many pages (One-to-Many)
      Chapter.hasMany(models.Page, {
        foreignKey: "chapter_id",
        as: "pages", // Alias to reference the pages within this chapter
      });
    }
  }
  Chapter.init(
    {
      course_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Chapter",
    }
  );
  return Chapter;
};
