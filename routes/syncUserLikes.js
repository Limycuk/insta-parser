var express = require("express");
var fs = require("fs");

var postsWithLikes = require("../data/postsWithLikes.json");
var parseFollowers = require("../data/parseFollowers.json");

var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  const followersWithLikes = parseFollowers.list.map(follower => {
    const data = postsWithLikes.list.reduce(
      (memo, post) => {
        if (post.likes.includes(follower.username)) {
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

  fs.writeFile(
    `data/followersWithLikes.json`,
    JSON.stringify({
      list: followersWithLikes,
      index: 0
    }),
    "utf8",
    function(err) {
      if (err) {
        console.log(err);
      }

      res.render("index", { title: JSON.stringify(followersWithLikes.length) });
    }
  );
});

module.exports = router;
