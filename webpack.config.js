const devConfig = require("./config/webpack.dev");
const prodConfig = require("./config/webpack.prod");

module.exports = (env) => {
  if (env.production) {
    return prodConfig;
  }
  return devConfig;
};
