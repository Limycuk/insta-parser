var express = require("express");

var getFollowerUsernames = require("../api/getFollowerUsernames");

var shortFollowersList = require("../../data/1-short-followers-list.json");
var saveDataToFile = require("../services/saveDataToFile");

var router = express.Router();

function getFollowers(res, username, list, index, end_cursor) {
  return new Promise(resolve => {
    setTimeout(() => {
      getFollowerUsernames(username, end_cursor)
        .then(({ usernames, page_info }) => {
          const updatedList = list.concat(usernames);

          if (page_info.has_next_page) {
            const request = getFollowers(
              res,
              username,
              updatedList,
              index + 1,
              page_info.end_cursor
            );

            request.then(usernames => resolve(usernames));
          } else {
            resolve(updatedList);
          }
        })
        .catch(error => {
          console.log("error == ", error);

          const data = {
            end_cursor,
            index,
            list
          };

          saveDataToFile("data/1-short-followers-list.json", data, function() {
            res.send(JSON.stringify(data));
          });
        });
    }, 1500);
  });
}

function getInitData() {
  if (shortFollowersList.index !== 0) {
    return {
      list: shortFollowersList.list,
      index: shortFollowersList.index,
      end_cursor: shortFollowersList.end_cursor
    };
  }

  return {
    list: [],
    index: 0,
    end_cursor: null
  };
}

/* GET followers listing. */
router.get("/:username", function(req, res, next) {
  const { username } = req.params;

  const { list, index, end_cursor } = getInitData();

  const request = getFollowers(res, username, list, index, end_cursor);

  request.then(usernames => {
    const data = {
      end_cursor: null,
      index: 0,
      list: usernames
    };

    saveDataToFile("data/1-short-followers-list.json", data, function() {
      res.send(JSON.stringify(usernames.length));
    });
  });
});

module.exports = router;
