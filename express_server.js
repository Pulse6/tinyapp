////// require and set up
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['123']
}));
////// set port to 8080
const PORT = 8080;

///// helper functions
const generateRandomString = function() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

let urlsForUser = id => {/// using id to fliter the links that belongs to user and returning an object
  let userURLdatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userURLdatabase[key] = urlDatabase[key].longURL;
    }
  }
  return userURLdatabase;
};

const validateEmail = (email) => {/// using email to see if it is in database
  for (let i of Object.keys(users)) {
    if (users[i].email === email) {
      return true;
    }
  }
  return false;
};

const getUser = (email) => {/// using email to grab the right object and return it
  for (let i of Object.keys(users)) {
    if (users[i].email === email) {
      return users[i];
    }
  }
  return false;
};
////// Database
const urlDatabase = {/// database for links and the user's id who made the link
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "userRandomID" }
};

const users = {/// databse for users info
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
////////////

app.get("/", (req, res) => {/// home page display home
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {/// use JSON to see what's in urlDatabase
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {/// display Hello World in path /hello
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {/// path for displaying user's urls
  if (req.session.user_id) {/// check if user are login if yes use urlsForUser function to filter the urls belongs to user
    let templateVars = { urls: urlsForUser(req.session.user_id), user_id: users[req.session.user_id]};
    res.render("urls_index", templateVars);
  } else { /// if user not login move them to login
    res.redirect('/login');
  }
});

app.get("/urls/new", (req, res) => {/// path for displaying adding links
  if (req.session.user_id === undefined) {/// to check is user are login
    res.redirect("/login");/// if not move them to login page
  }
  let templateVars = {/// putting user id in templateVars obj to pass it to urls_new
    user_id: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {///  path for displaying the new link the user just added
  /// if not users give them a 401 statuscode
  if (req.session.user_id === undefined || req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(res.statusCode = 401);
  }
  /// using templateVars to pass in data for rendering in urls_show
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL , user_id: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {/// for this path render urls_register
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  /// cheack if email are already in database and is they are emty or not
  if (validateEmail(req.body.email) === true || req.body.email === "" || req.body.password === "") {
    res.sendStatus(res.statusCode = 400);
  }
  let hashPassword = bcrypt.hashSync(req.body.password, 10);/// incrypt password
  let id = generateRandomString();/// make a random id for a new user
  users[id] = {id: id, email: req.body.email, password: hashPassword};/// creating user and store it in database
  req.session.user_id = id;/// making a session for user
  res.redirect("/urls");/// bring user to path urls
});

app.post("/urls", (req, res) => {/// user adding a new link
  let newCode = generateRandomString();/// random ID ket for link and user's id
  urlDatabase[newCode] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${newCode}`);/// bring user to /urls with the new link they made
});

app.get("/login", (req, res) => {/// for path /login render urls_login
  res.render("urls_login");
});

app.post("/login", (req, res) => {/// action for when user click login button
  const obj = getUser(req.body.email);/// grabing the obj with email
  if (validateEmail(req.body.email) === false) {/// see if email is in database
    res.sendStatus(res.statusCode = 403);/// if not send status code 403
  } else if (bcrypt.compareSync(req.body.password, obj.password) === false) {/// see if password matches
    res.sendStatus(res.statusCode = 403);/// if not send status code 403
  }
  req.session.user_id = obj.id;/// making a sesstion
  res.redirect('/urls');/// bring user to path urls
});

app.post("/logout", (req, res) => {/// action for logout button
  req.session = null;/// set sesstion to null 
  res.redirect('/login');/// bring user to path login
});

app.post("/urls/:shortURL/delete", (req, res) => {/// action for when user click the delete button on path urls
  /// check if user are aloud to delete when their id
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(res.statusCode = 401);
  }
  delete urlDatabase[req.params.shortURL];/// deleting the key in database
  res.redirect(`/urls`);/// bring user back to path urls
});

app.post("/urls/:id/update", (req, res) => {/// action for when user click the submit botton at path urls:shorurl
  /// check if the link belongs to user
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.sendStatus(res.statusCode = 401);
  }
  let id = req.params.id;
  urlDatabase[req.params.id].longURL = req.body.update;/// replacing old link with new link
  res.redirect(`/urls/${id}`);
});

app.get("/u/:shortURL", (req, res) => {/// with the right key in urldatabse will bring user to the longURL storge in that key
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {/// console.log in shell when server is up and going
  console.log(`Example app listening on port ${PORT}!`);
});