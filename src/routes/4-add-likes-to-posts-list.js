var express = require("express");
var axios = require("axios");
var fs = require("fs");
var config = require("config");

var postsList = require("../../data/3-posts-list.json");
var postsListWithLikes = require("../../data/4-posts-list-with-likes.json");
var saveDataToFile = require("../services/saveDataToFile");

var router = express.Router();

function parseLikes(list, shortcode, end_cursor) {
  return new Promise((resolve, reject) => {
    const variables = {
      shortcode: shortcode,
      first: 50
    };

    if (end_cursor) {
      variables.after = end_cursor;
    }

    setTimeout(() => {
      axios({
        method: "get",
        url: "https://www.instagram.com/graphql/query",
        params: {
          query_hash: config.get("query_hash.likes"),
          variables: JSON.stringify(variables)
        },
        headers: {
          cookie: config.get("cookie")
        }
      }).then(response => {
        const {
          edges,
          page_info
        } = response.data.data.shortcode_media.edge_liked_by;

        const usernames = edges.map(edge => edge.node.username);
        if (page_info.has_next_page) {
          parseLikes(
            [...list, ...usernames],
            shortcode,
            page_info.end_cursor
          ).then(newList => {
            resolve(newList);
          });
        } else {
          resolve([...list, ...usernames]);
        }
      });
    }, 3000);
  });
}

function parsePost(parsedPosts, post, index) {
  return new Promise((resolve, reject) => {
    console.log("post index == ", index);
    parseLikes([], post.shortcode).then(usernames => {
      const newList = parsedPosts.concat([
        {
          ...post,
          likes: usernames
        }
      ]);

      resolve(newList);
    });
  });
}

/* GET home page. */
router.get("/", function(req, res, next) {
  const remainingPosts = postsList.list.slice(postsListWithLikes.index);
  const result = remainingPosts.reduce((memo, post, index) => {
    if (memo) {
      return memo.then(list => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const data = {
              list,
              index: postsListWithLikes.index + index
            };

            saveDataToFile(
              "data/4-posts-list-with-likes.json",
              data,
              function() {
                resolve(
                  parsePost(list, post, postsListWithLikes.index + index)
                );
              }
            );
          }, 4000);
        });
      });
    }

    return parsePost(postsListWithLikes.list, post, postsListWithLikes.index);
  }, null);

  result.then(postsListWithLikes => {
    const data = {
      list: postsListWithLikes,
      index: 0
    };

    saveDataToFile("data/4-posts-list-with-likes.json", data, function() {
      res.render(JSON.stringify(postsListWithLikes));
    });
  });
});

module.exports = router;
