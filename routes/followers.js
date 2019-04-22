var express = require("express");
var axios = require("axios");
var fs = require("fs");
var config = require("config");

var followersData = require("../data/followers.json");

var router = express.Router();

function getFollowers(list, index, end_cursor) {
  return new Promise(resolve => {
    const variables = {
      id: 2259414318,
      include_reel: true,
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
          fs.writeFile(
            "data/followers.json",
            JSON.stringify({
              end_cursor,
              index,
              list
            }),
            "utf8",
            function(err) {
              if (err) {
                console.log(err);
              }

              res.send(
                JSON.stringify({
                  end_cursor,
                  index: 0,
                  list
                })
              );
            }
          );
        });
    }, 2000);
  });
}

/* GET followers listing. */
router.get("/", function(req, res, next) {
  const request = getFollowers(
    followersData.list,
    followersData.index,
    followersData.end_cursor
  );
  request.then(followerList => {
    fs.writeFile(
      "data/followers.json",
      JSON.stringify({
        end_cursor: null,
        index: 0,
        list: followerList
      }),
      "utf8",
      function(err) {
        if (err) {
          console.log(err);
        }

        res.send(JSON.stringify(followerList.length));
      }
    );
  });
});

module.exports = router;
