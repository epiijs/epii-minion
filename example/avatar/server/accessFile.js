const fs = require('fs');
const path = require('path');

module.exports = async function accessFile(input) {
  return fs.createReadStream(path.join(__dirname, 'accessFile.js'));
}