var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
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

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});