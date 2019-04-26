var fs = require("fs");

function saveDataToFile(fileName, data, callback) {
  if (data && data.index) {
    console.log("index === ", data.index);
  }

  fs.writeFile(fileName, JSON.stringify(data), "utf8", function(err) {
    if (err) {
      console.log("err == ", err);
    }

    callback();
  });
}

module.exports = saveDataToFile;
