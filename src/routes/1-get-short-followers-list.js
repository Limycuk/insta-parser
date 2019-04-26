var express = require("express");
var axios = require("axios");
var fs = require("fs");
var config = require("config");

var shortFollowersList = require("../../data/1-short-followers-list.json");
var saveDataToFile = require("../services/saveDataToFile");

var router = express.Router();

function getFollowers(list, index, end_cursor) {
  return new Promise(resolve => {
    const variables = {
      id: 2259414318,
      include_reel: false,
      fetch_mutual: false,
      first: 50
    };

    if (end_cursor) {
      variables.after = end_cursor;
    }

    setTimeout(() => {
      axios({
        method: "GET",
        url: "https://www.instagram.com/graphql/query",
        params: {
          query_hash: config.get("query_hash.followers"),
          variables: JSON.stringify(variables)
        },
        headers: {
          cookie: config.get("cookie")
        }
      })
        .then(response => {
          const { edges, page_info } = response.data.data.user.edge_followed_by;
          const followerList = edges
            .map(follower => follower.node.username)
            .concat(list);

          if (page_info.has_next_page) {
            const request = getFollowers(
              followerList,
              index + 1,
              page_info.end_cursor
            );
            request.then(list => resolve(list));
          } else {
            resolve(followerList);
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
    }, 2000);
  });
}

/* GET followers listing. */
router.get("/", function(req, res, next) {
  const request = getFollowers(
    shortFollowersList.list,
    shortFollowersList.index,
    shortFollowersList.end_cursor
  );

  request.then(followerList => {
    const data = {
      end_cursor: null,
      index: 0,
      list: followerList
    };

    saveDataToFile("data/1-short-followers-list.json", data, function() {
      res.send(JSON.stringify(followerList.length));
    });
  });
});

module.exports = router;
