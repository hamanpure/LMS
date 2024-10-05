"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Page extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A page belongs to a chapter (One-to-Many)
      Page.belongsTo(models.Chapter, {
        foreignKey: "chapter_id",
        as: "chapter", // Alias to reference the chapter this page belongs to
      });

      // A page has many progress entries (One-to-Many)
      Page.hasMany(models.Progress, {
        foreignKey: "page_id",
        as: "progressEntries", // Alias to reference the progress entries for this page
      });
    }
  }
  Page.init(
    {
      chapter_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      content: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Page",
    }
  );
  return Page;
};
