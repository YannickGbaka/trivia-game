const path = require("path");

const getAbsolutePathTo = (relativePath) => {
  return path.join(__dirname, `../${relativePath}`);
};

module.exports = { getAbsolutePathTo };
