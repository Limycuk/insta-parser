var express = require("express");

var shortFollowersList = require("../../data/1-short-followers-list.json");
var postsList = require("../../data/3-posts-list.json");
var postsListWithLikes = require("../../data/4-posts-list-with-likes.json");
var saveDataToFile = require("../services/saveDataToFile");
var getPostLikes = require("../api/getPostLikes");
var router = express.Router();

function parseLikes(list, shortcode, end_cursor) {
  return new Promise(resolve => {
    setTimeout(() => {
      getPostLikes(shortcode, end_cursor).then(({ usernames, page_info }) => {
        const updatedList = list.concat(usernames);

        if (page_info.has_next_page) {
          parseLikes(updatedList, shortcode, page_info.end_cursor).then(
            newList => {
              resolve(newList);
            }
          );
        } else {
          resolve(updatedList);
        }
      });
    }, 2900);
  });
}

function filtersFollowers(usernames) {
  return usernames.reduce(
    (memo, username) => {
      if (shortFollowersList.list.includes(username)) {
        memo.followers.push(username);
      } else {
        memo.nonFollowers.push(username);
      }

      return memo;
    },
    {
      followers: [],
      nonFollowers: []
    }
  );
}

function parsePost(parsedPosts, post, index) {
  return new Promise(resolve => {
    parseLikes([], post.shortcode).then(usernames => {
      const filteredLikes = filtersFollowers(usernames);
      const newList = parsedPosts.concat([
        {
          ...post,
          likes: {
            count: post.likes,
            ...filteredLikes
          }
        }
      ]);

      resolve(newList);
    });
  });
}

function getInitData() {
  const initialIndex = postsListWithLikes.index;
  const remainingPosts = postsList.list.slice(initialIndex);
  const initialList = postsListWithLikes.list;

  return {
    initialIndex,
    remainingPosts,
    initialList
  };
}

/* GET home page. */
router.get("/", function(req, res, next) {
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
              "data/4-posts-list-with-likes.json",
              data,
              function() {
                resolve(parsePost(list, post, initialIndex + index));
              }
            );
          }, 4000);
        });
      });
    }

    return parsePost(initialList, post, initialIndex);
  }, null);

  result.then(postsListWithLikes => {
    const data = {
      list: postsListWithLikes,
      index: 0
    };

    saveDataToFile("data/4-posts-list-with-likes.json", data, function() {
      res.send(JSON.stringify(postsListWithLikes.length));
    });
  });
});

module.exports = router;
