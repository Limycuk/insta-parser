var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// var indexRouter = require("./routes/index");
var shortFollowersListRouter = require("./src/routes/1-get-short-followers-list");
var fullFollowersListRouter = require("./src/routes/2-get-full-followers-list");
var postsListRouter = require("./src/routes/3-get-posts-list");
var postsListWithLikesRouter = require("./src/routes/4-add-likes-to-posts-list");
var followersListWithLikesRouter = require("./src/routes/5-add-likes-to-user.js");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use("/", indexRouter);
app.use("/get-short-follower-list", shortFollowersListRouter);
app.use("/get-full-followers-list", fullFollowersListRouter);
app.use("/get-posts-list", postsListRouter);
app.use("/add-likes-to-posts", postsListWithLikesRouter);
app.use("/add-likes-to-user", followersListWithLikesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
