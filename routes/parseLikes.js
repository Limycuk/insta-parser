var express = require("express");
var axios = require("axios");
var fs = require("fs");
var config = require("config");

var parsedPosts = require("../data/parsedPosts.json");
var postsWithLikes = require("../data/postsWithLikes.json");

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
    console.log("index == ", index);
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
  const remainingPosts = parsedPosts.list.slice(postsWithLikes.index);
  const result = remainingPosts.reduce((memo, post, index) => {
    if (memo) {
      return memo.then(list => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            fs.writeFile(
              `data/postsWithLikes.json`,
              JSON.stringify({
                list,
                index: postsWithLikes.index + index
              }),
              "utf8",
              function(err) {
                if (err) {
                  console.log(err);
                }

                resolve(parsePost(list, post, postsWithLikes.index + index));
              }
            );
          }, 4000);
        });
      });
    }

    return parsePost(postsWithLikes.list, post, postsWithLikes.index);
  }, null);

  result.then(postsWithLikes => {
    fs.writeFile(
      `data/postsWithLikes.json`,
      JSON.stringify({
        list: postsWithLikes,
        index: 0
      }),
      "utf8",
      function(err) {
        if (err) {
          console.log(err);
        }

        res.render("index", { title: JSON.stringify(postsWithLikes) });
      }
    );
  });
});

module.exports = router;
