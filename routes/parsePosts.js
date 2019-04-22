var express = require("express");
var axios = require("axios");
var fs = require("fs");
var config = require("config");

var parsedPosts = require("../data/parsedPosts.json");

var router = express.Router();

function parse(list, end_cursor, index) {
  return new Promise((resolve, reject) => {
    const variables = {
      id: 2259414318,
      after: end_cursor,
      first: 50
    };

    axios({
      method: "get",
      url: "https://www.instagram.com/graphql/query",
      params: {
        query_hash: config.get("query_hash.posts"),
        variables: JSON.stringify(variables)
      },
      headers: {
        cookie: config.get("cookie")
      }
    })
      .then(response => {
        const {
          edges,
          page_info
        } = response.data.data.user.edge_owner_to_timeline_media;
        const posts = edges.map(edge => {
          return {
            display_url: edge.node.display_url,
            id: edge.node.id,
            shortcode: edge.node.shortcode
          };
        });

        if (page_info.has_next_page) {
          console.log("index == ", index);
          parse([...list, ...posts], page_info.end_cursor, index + 1).then(
            newList => resolve(newList)
          );
        } else {
          resolve([...list, ...posts]);
        }
      })
      .catch(error => {
        console.log("error == ", error);

        fs.writeFile(
          `data/parsedPosts.json`,
          JSON.stringify({
            list,
            end_cursor,
            index
          }),
          "utf8",
          function(err) {
            if (err) {
              console.log(err);
            }

            res.send(JSON.stringify(list.length));
          }
        );
      });
  });
}

/* GET home page. */
router.get("/:username", function(req, res, next) {
  const { username } = req.params;

  if (parsedPosts.index === 0) {
    axios({
      method: "get",
      url: "https://www.instagram.com/" + username + "/?__a=1",
      headers: {
        cookie: config.get("cookie")
      }
    }).then(response => {
      const {
        edges,
        page_info
      } = response.data.graphql.user.edge_owner_to_timeline_media;

      const posts = edges.map(edge => {
        return {
          display_url: edge.node.display_url,
          id: edge.node.id,
          shortcode: edge.node.shortcode
        };
      });

      console.log("index == ", 0);
      parse(posts, page_info.end_cursor, 1).then(list => {
        fs.writeFile(
          `data/parsedPosts.json`,
          JSON.stringify({
            list,
            index: 0,
            end_cursor: null
          }),
          "utf8",
          function(err) {
            if (err) {
              console.log(err);
            }

            res.send(JSON.stringify(list.length));
          }
        );
      });
    });
  } else {
    parse(parsedPosts.list, parsedPosts.end_cursor, parsedPosts.index).then(
      list => {
        fs.writeFile(
          `data/parsedPosts.json`,
          JSON.stringify({
            list,
            index: 0,
            end_cursor: null
          }),
          "utf8",
          function(err) {
            if (err) {
              console.log(err);
            }

            res.send(JSON.stringify(list.length));
          }
        );
      }
    );
  }
});

module.exports = router;
