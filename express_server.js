const express = require("express");
const bcrypt = require('bcrypt');
let cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
app.set("view engine", "ejs");

const PORT = 8080; // default port 8080

const generateRandomString = function() {
  let result           = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

let urlsForUser = id => {
  let userURLdatabase = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLdatabase[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userURLdatabase;
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "123"
  }
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  // let fliterURL = urlsForUser(req.cookies.user_id.id)
  if (req.cookies.user_id) {
    let templateVars = { urls: urlsForUser(req.cookies.user_id.id), user_id: req.cookies["user_id"]};
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.redirect("/login");
  }
  let templateVars = {
    user_id: req.cookies.user_id
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id === undefined || req.cookies.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(res.statusCode = 401);
  }
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL , user_id: req.cookies["user_id"]};
  res.render("urls_show", templateVars);
});

const validateEmail = (email) => {
  for (let i of Object.keys(users)) {
    if (users[i].email === email) {
      return true;
    }
  }
  return false;
};

const getUser = (email) => {
  for (let i of Object.keys(users)) {
    if (users[i].email === email) {
      return users[i];
    }
  }
  return false;
};

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  if (validateEmail(req.body.email) === true || req.body.email === "" || req.body.password === "") {
    res.sendStatus(res.statusCode = 400);
  }
  let hashPassword = bcrypt.hashSync(req.body.password, 10)
  let id = generateRandomString();
  users[id] = {id: id, email: req.body.email, password: hashPassword};
  res.cookie('user_id', id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/urls", (req, res) => {
  let newCode = generateRandomString();
  urlDatabase[newCode] = { longURL: req.body.longURL, userID: req.cookies.user_id.id };
  res.redirect(`/urls/${newCode}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(res.statusCode = 401);
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {
  if (req.cookies.user_id.id !== urlDatabase[req.params.id].userID) {
    res.sendStatus(res.statusCode = 401);
  }
  let id = req.params.id;
  urlDatabase[req.params.id].longURL = req.body.update;
  res.redirect(`/urls/${id}`);
});

app.post("/login", (req, res) => {
  const obj = getUser(req.body.email);
  if (validateEmail(req.body.email) === false) {
    res.sendStatus(res.statusCode = 403);
  } else if (bcrypt.compareSync(req.body.password, obj.password) === false) {
    res.sendStatus(res.statusCode = 403);
  }
  res.cookie('user_id', obj);
  res.redirect('/urls',);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', users[req.cookies.user_id]);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});