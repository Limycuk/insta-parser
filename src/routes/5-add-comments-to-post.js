var express = require("express");

var shortFollowersList = require("../../data/1-short-followers-list.json");
var postsList = require("../../data/4-posts-list-with-likes.json");
var postsListWithComments = require("../../data/5-posts-list-with-likes-and-posts.json");
var saveDataToFile = require("../services/saveDataToFile");
var parseHashTags = require("../services/parseHashTags");
var getPostComments = require("../api/getPostComments");
var router = express.Router();

function mergeComments(list, otherList) {
  const usernames = [...Object.keys(list), ...Object.keys(otherList)];
  return usernames.reduce((memo, item) => {
    let comments = [];

    if (list[item]) {
      comments = comments.concat(list[item]);
    }

    if (otherList[item]) {
      comments = comments.concat(otherList[item]);
    }

    memo[item] = comments;

    return memo;
  }, {});
}

function parseComments(list, shortcode, end_cursor) {
  return new Promise(resolve => {
    setTimeout(() => {
      getPostComments(shortcode, end_cursor).then(({ data, page_info }) => {
        const updatedList = mergeComments(list, data);

        if (page_info.has_next_page) {
          parseComments(updatedList, shortcode, page_info.end_cursor).then(
            newList => {
              resolve(newList);
            }
          );
        } else {
          resolve(updatedList);
        }
      });
    }, 2800);
  });
}

function filtersFollowers(owner, list) {
  return Object.keys(list).reduce(
    (memo, username) => {
      if (owner === username) {
        memo.owner = list[owner];
      } else if (shortFollowersList.list.includes(username)) {
        memo.followers[username] = list[username];
      } else {
        memo.nonFollowers[username] = list[username];
      }

      return memo;
    },
    {
      followers: {},
      nonFollowers: {}
    }
  );
}

function parsePost(owner, parsedPosts, post, index) {
  return new Promise(resolve => {
    console.log("post index == ", index);

    parseComments({}, post.shortcode).then(list => {
      const comments = filtersFollowers(owner, list);
      let hashtags = [];

      if (comments.owner) {
        hashtags = parseHashTags(comments.owner);
      }
      console.log("hashtags == ", hashtags);
      const newList = parsedPosts.concat([
        {
          ...post,
          comments,
          hashtags
        }
      ]);

      resolve(newList);
    });
  });
}

function getInitData() {
  const initialIndex = postsListWithComments.index;
  const remainingPosts = postsList.list.slice(initialIndex);
  const initialList = postsListWithComments.list;

  return {
    initialIndex,
    remainingPosts,
    initialList
  };
}

/* GET home page. */
router.get("/:username", function(req, res) {
  const { username } = req.params;
  const { initialIndex, initialList, remainingPosts } = getInitData();

  const result = remainingPosts.reduce((memo, post, index) => {
    if (memo) {
      return memo.then(list => {
        return new Promise(resolve => {
          setTimeout(() => {
            const data = {
              list,
              index: initialIndex + index
            };

            saveDataToFile(
              "data/5-posts-list-with-likes-and-posts.json",
              data,
              function() {
                resolve(parsePost(username, list, post, initialIndex + index));
              }
            );
          }, 3900);
        });
      });
    }

    return parsePost(username, initialList, post, initialIndex);
  }, null);

  result.then(postsListWithComments => {
    const data = {
      list: postsListWithComments,
      index: 0
    };

    saveDataToFile(
      "data/5-posts-list-with-likes-and-posts.json",
      data,
      function() {
        res.send(JSON.stringify(postsListWithComments.length));
      }
    );
  });
});

module.exports = router;
