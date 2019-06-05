var axios = require("axios");
var config = require("config");

function getPostComments(shortcode, end_cursor) {
  const variables = {
    shortcode: shortcode,
    first: 50
  };

  if (end_cursor) {
    variables.after = end_cursor;
  }

  return new Promise(resolve => {
    axios({
      method: "get",
      url: "https://www.instagram.com/graphql/query",
      params: {
        query_hash: config.get("query_hash.comments"),
        variables: JSON.stringify(variables)
      },
      headers: {
        cookie: config.get("cookie")
      }
    }).then(response => {
      const {
        edges,
        page_info
      } = response.data.data.shortcode_media.edge_media_to_parent_comment;

      const data = edges.reduce((memo, item) => {
        const { text, owner, edge_threaded_comments } = item.node;
        const { username } = owner;

        if (memo[username]) {
          memo[username].push(text);
        } else {
          memo[username] = [text];
        }

        for (let item of edge_threaded_comments.edges) {
          const { text, owner } = item.node;
          const { username } = owner;

          if (memo[username]) {
            memo[username].push(text);
          } else {
            memo[username] = [text];
          }
        }

        return memo;
      }, {});

      resolve({
        data,
        page_info
      });
    });
  });
}

module.exports = getPostComments;
