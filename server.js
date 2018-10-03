var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var PORT = process.env.PORT || 8080;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/mongrio", { useNewUrlParser: true });

app.get("/scrape", function (req, res) {
    axios.get("https://www.jacobinmag.com/").then(function (response) {
        var $ = cheerio.load(response.data);

        $("article").each(function (i, element) {
            var result = {};

            result.title = $(this)
                .children("div")
                .children("h3")
                .children("a")
                .text();
            result.link = "https://www.jacobinmag.com/" + $(this)
                .children("a")
                .attr("href");
            result.summary = $(this)
                .children("div")
                .children("p")
                .text();
            result.img = $(this)
                .children("a")
                .children("img")
                .attr("src");

            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    res.json(err);
                });

        });
        res.send("Scrape Complete");
    });
});

app.get("/", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            console.log(dbArticle);
            res.render("index", { articles: dbArticle });
        })
    // res.render("index", { something: "something" });
})

app.post("/articles", function (req, res) {
    console.log("req.body: ", req.body.comment);
    db.Comment.create(req.body.comment)
        .then(function (dbComment) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.body.id }, { $push: { comments: dbComment._id } }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});

//_id: "5bb438d216446d95447acfbb"