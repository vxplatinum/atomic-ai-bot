const path = require("path");
const express = require("express");

const app = express();
// Demo shop. The bot allowed_domain for this embed must be localhost:3000.
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT}`);
});
