var express = require("express");

var fullFollowersList = require("../../data/2-full-followers-list.json");
var postsListWithLikes = require("../../data/4-posts-list-with-likes.json");
var saveDataToFile = require("../services/saveDataToFile");

var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  const followersWithLikes = fullFollowersList.list.map(follower => {
    const data = postsListWithLikes.list.reduce(
      (memo, post) => {
        if (post.likes.followers.includes(follower.username)) {
          memo.likes.push(post.shortcode);
          memo.count++;
        } else {
          memo.dislikes.push(post.shortcode);
        }

        return memo;
      },
      {
        count: 0,
        likes: [],
        dislikes: []
      }
    );

    return {
      ...follower,
      likes: data
    };
  });

  saveDataToFile(
    "data/6-full-followers-list-with-likes.json",
    followersWithLikes,
    function() {
      res.send(JSON.stringify(followersWithLikes.length));
    }
  );
});

module.exports = router;
