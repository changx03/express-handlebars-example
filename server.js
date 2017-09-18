var express = require("express");
var handlebars = require("express-handlebars");
var formidable = require("formidable");
var credentials = require("./credentials");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var session = require("express-session");
var parseurl = require("parseurl");
var fs = require("fs");

var app = express();
app.disable("x-powered-by");

app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(bodyparser.urlencoded({ extended: true }));

app.use(cookieparser(credentials.cookieSecret));

app.set("port", process.env.PORT || 3000);
app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
  res.render("home");
});

app.use(function(err, req, res, next) {
  console.log("Error : " + err.message);
  next();
});

/**
 * For cookies
 */
app.get("/cookie", function(req, res) {
  res
    .cookie("username", "bla bla", { expire: new Date() + 1 })
    .send("username has the value of bla bla");
});

app.get("/listcookies", function(req, res) {
  console.log("Cookies: " + req.cookies.username);
  res.send("Look in the console for cookies");
});

app.get("/deletecookie", function(req, res) {
  res.clearCookie("username");
  res.send("Cookie - username deleted");
});

/**
 * Session
 */
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: credentials.cookieSecret
  })
);

app.use(function(req, res, next) {
  var views = req.session.views;
  if (!views) {
    views = req.session.views = {};
  }
  var pathname = parseurl(req).pathname;
  views.pathname = (views.pathname || 0) + 1;
  next();
});
app.get("/viewcount", function(req, res, next) {
  res.send(`You viewed this page ${req.session.views.pathname}`);
});

/**
 * Standard pages
 */
app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/contact", function(req, res) {
  res.render("contact", { csrf: "CSRF token here" });
});

app.get("/thankyou", function(req, res) {
  res.render("thankyou");
});

/**
 * Post form
 */
app.post("/process", function(req, res) {
  console.log(`Form ${req.query.form}`);
  console.log(`CSRF ${req.body._csrf}`);
  console.log(req.body.email + " " + req.body.ques);
  res.redirect(303, "/thankyou");
});

/**
 * Upload image
 */
app.get("/file-upload", function(req, res) {
  var now = new Date();
  res.render("file-upload", {
    year: now.getFullYear(),
    month: now.getMonth()
  });
});

app.post("/file-upload/:year/:month", function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, file) {
    if (err) {
      res.redirect(303, "/500");
    } else {
      console.log("Received file");
      console.log(file);
      res.redirect(303, "/thankyou");
    }
  });
});

/**
 * Read file from server
 */
app.get("/readfile", function(req, res, next) {
  try {
    var data = fs.readFileSync("./public/randomfile.txt");
    res.send("File: " + data.toString());
  } catch (error) {
    console.error(error);
    throw error;
  }
});

/**
 * Write file to server
 */
app.get("/writefile", function(req, res, next) {
  try {
    fs.appendFileSync("./public/randomWriteFile.txt", "More text\r\n");
    var data = fs.readFileSync("./public/randomWriteFile.txt");
    res.send("Write file: " + data.toString());
  } catch (error) {
    console.error(error);
    throw error;
  }
});

/**
 * Error handling pages
 */
app.use(function(req, res) {
  res.type("text/html");
  res.status(404);
  res.render("404");
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});

/**
 * Listener
 */
app.listen(app.get("port"), function() {
  console.log(
    "Express started on http://localhost:" +
      app.get("port") +
      " press Ctrl-C to terminate"
  );
});
