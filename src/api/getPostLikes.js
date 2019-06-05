var axios = require("axios");
var config = require("config");

function getPostLikes(shortcode, end_cursor) {
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

      resolve({
        usernames,
        page_info
      });
    });
  });
}

module.exports = getPostLikes;
