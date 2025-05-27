const path = require("path");

module.exports = {
  entry: "./src/main/main.js",
  output: {
    path: path.resolve(__dirname, "../build"),
    filename: "main.js",
  },
  target: "electron-main",
};
