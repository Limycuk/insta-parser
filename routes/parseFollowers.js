var express = require("express");
var axios = require("axios");
var fs = require("fs");
var config = require("config");

var followers = require("../data/followers.json");
var parseFollowers = require("../data/parseFollowers.json");

var router = express.Router();

function parser(list, username, index) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      axios({
        method: "get",
        url: "https://www.instagram.com/" + username + "/?__a=1",
        headers: {
          cookie: config.get("cookie")
        }
      })
        .then(response => {
          const {
            username,
            edge_followed_by,
            edge_follow,
            full_name,
            id,
            profile_pic_url,
            edge_owner_to_timeline_media
          } = response.data.graphql.user;

          list.push({
            username,
            followers: edge_followed_by.count,
            followings: edge_follow.count,
            fullName: full_name,
            id,
            avatar: profile_pic_url,
            mediaCounts: edge_owner_to_timeline_media.count
          });
          console.log("index == ", index);
          resolve(list);
        })
        .catch(error => {
          console.log("error == ", error);
          fs.writeFile(
            "data/parseFollowers.json",
            JSON.stringify({
              list,
              index
            }),
            "utf8",
            function(err) {
              if (err) {
                console.log(err);
              }

              res.render("index", { title: JSON.stringify(list.length) });
            }
          );
        });
    }, 1000);
  });
}

/* GET home page. */
router.get("/", function(req, res, next) {
  const followerList = followers.list.slice(parseFollowers.index);

  const result = followerList.reduce((memo, username, index) => {
    if (memo) {
      return memo.then(list => {
        return parser(list, username, parseFollowers.index + index);
      });
    }

    return parser(parseFollowers.list, username, parseFollowers.index + index);
  }, null);

  result.then(list => {
    fs.writeFile(
      "data/parseFollowers.json",
      JSON.stringify({
        list,
        index: 0
      }),
      "utf8",
      function(err) {
        if (err) {
          console.log(err);
        }

        res.render("index", { title: JSON.stringify(list.length) });
      }
    );
  });
});

module.exports = router;
