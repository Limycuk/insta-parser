var express = require("express");
var axios = require("axios");
var config = require("config");

var shortFollowersList = require("../../data/1-short-followers-list.json");
var fullFollowersList = require("../../data/2-full-followers-list.json");
var saveDataToFile = require("../services/saveDataToFile");

var router = express.Router();

function parseFollower(res, list, username, index) {
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
          console.log("follower index == ", index);
          resolve(list);
        })
        .catch(error => {
          console.log("error == ", error);

          const data = {
            list,
            index
          };

          saveDataToFile("data/2-full-followers-list.json", data, function() {
            res.send(JSON.stringify(data));
          });
        });
    }, 850);
  });
}

/* GET home page. */
router.get("/", function(req, res) {
  const followerList = shortFollowersList.list.slice(fullFollowersList.index);

  const result = followerList.reduce((memo, username, index) => {
    if (memo) {
      return memo.then(list => {
        return parseFollower(
          res,
          list,
          username,
          fullFollowersList.index + index
        );
      });
    }

    return parseFollower(
      res,
      fullFollowersList.list,
      username,
      fullFollowersList.index
    );
  }, null);

  result.then(list => {
    const data = {
      list,
      index: 0
    };

    saveDataToFile("data/2-full-followers-list.json", data, function() {
      res.send(JSON.stringify(data.list.length));
    });
  });
});

module.exports = router;
