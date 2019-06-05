var express = require("express");
var axios = require("axios");
var fs = require("fs");
var config = require("config");

var postsList = require("../../data/3-posts-list.json");
var saveDataToFile = require("../services/saveDataToFile");

var router = express.Router();

const LIMIT_OF_POSTS = 50;

function parsePost(res, list, end_cursor, index) {
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
            shortcode: edge.node.shortcode,
            location: edge.node.location
          };
        });

        const newList = [...list, ...posts];

        if (newList.length >= LIMIT_OF_POSTS) {
          resolve(newList.slice(0, LIMIT_OF_POSTS));
        } else if (page_info.has_next_page) {
          parsePost(res, newList, page_info.end_cursor, index + 1).then(
            newList => resolve(newList)
          );
        } else {
          resolve(newList);
        }
      })
      .catch(error => {
        console.log("error == ", error);

        const data = {
          list,
          end_cursor,
          index
        };

        saveDataToFile("data/3-posts-list.json", data, function() {
          res.render(JSON.stringify(data));
        });
      });
  });
}

/* GET home page. */
router.get("/:username", function(req, res, next) {
  const { username } = req.params;

  if (postsList.index === 0) {
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
          shortcode: edge.node.shortcode,
          location: edge.node.location,
          likes: edge.node.edge_media_preview_like.count
        };
      });

      parsePost(res, posts, page_info.end_cursor, 1).then(list => {
        const data = {
          list,
          index: 0,
          end_cursor: null
        };

        saveDataToFile("data/3-posts-list.json", data, function() {
          res.send(JSON.stringify(data));
        });
      });
    });
  } else {
    parsePost(
      res,
      parsedPosts.list,
      parsedPosts.end_cursor,
      parsedPosts.index
    ).then(list => {
      const data = {
        list,
        index: 0,
        end_cursor: null
      };

      saveDataToFile("data/3-posts-list.json", data, function() {
        res.send(JSON.stringify(data));
      });
    });
  }
});

module.exports = router;
