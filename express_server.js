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

/// helper functions
const { getUser } = require("./helpers");
const { generateRandomString } = require("./helpers");

let urlsForUser = id => {/// using id to fliter the links that belongs to user and returning an object
  let userURLdatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userURLdatabase[key] = urlDatabase[key].longURL;
    }
  }
  return userURLdatabase;
};

const validateEmail = email => {/// using email to see if it is in database
  for (let i of Object.keys(users)) {
    if (users[i].email === email) {
      return true;
    }
  }
  return false;
};

const isShorturlInData = shortURL => {/// check if the shortURL is in database
  for (let key in urlDatabase) {
    if (urlDatabase[key].shortURL === shortURL) {
      return true;
    }
  }
  return false;
};

////// Database
/// database for links and the user's id who made the link
const urlDatabase = {};
/// databse for users info
const users = {};

////////////

app.get("/", (req, res) => {/// see if user are login
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {/// path for displaying user's urls
  if (req.session.user_id) {/// check if user are login if yes use urlsForUser function to filter the urls belongs to user
    let templateVars = { urls: urlsForUser(req.session.user_id), user_id: users[req.session.user_id]};
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/new", (req, res) => {/// path for displaying adding links
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  }
  let templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {///  path for displaying the new link the user just added
  if (!urlDatabase[req.params.shortURL]) {
    res.status(401).send(`link doesn't exist`);
    return;
  }
  /// if not users give them a 401 statuscode
  if (req.session.user_id === undefined) {
    res.status(401).send('Please login');
    return;
  } else if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.status(401).send('This link is not yours');
    return;
  }
  /// using templateVars to pass in data for rendering in urls_show
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL , user_id: users[req.session.user_id]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {/// with the right key in urldatabse will bring user to the longURL storge in that key
  if (isShorturlInData(req.param.shortURL) === false) {
    res.status(401).send(`This link doesn't exist`);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {/// user adding a new link
  if (req.session.user_id === undefined) {
    res.status(401).send('Please login');
    return;
  }
  let newCode = generateRandomString();/// random ID ket for link and user's id
  urlDatabase[newCode] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${newCode}`);/// bring user to /urls with the new link they made
});

app.post("/urls/:shortURL/delete", (req, res) => {/// action for when user click the delete button on path urls
  /// check if user are aloud to delete when their id
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.status(401).send('please login');
    return;
  }
  delete urlDatabase[req.params.shortURL];/// deleting the key in database
  res.redirect(`/urls`);
});

app.post("/urls/:id/update", (req, res) => {/// action for when user click the submit botton at path urls:shorurl
  /// check if the link belongs to user
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(401).send('please login');
    return;
  }
  let id = req.params.id;
  urlDatabase[req.params.id].longURL = req.body.update;
  res.redirect(`/urls/${id}`);
});

app.get("/login", (req, res) => {/// for path /login render urls_login
  let templateVars = {/// putting user id in templateVars obj to pass it to urls_new
    user_id: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {/// for this path render urls_register
  let templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render("urls_register", templateVars);
});

app.post("/login", (req, res) => {/// action for when user click login button
  const obj = getUser(req.body.email, users);/// grabing the obj with email
  if (validateEmail(req.body.email) === false) {
    res.status(403).send('invalid email');
    return;
  } else if (bcrypt.compareSync(req.body.password, obj.password) === false) {
    res.status(403).send('invalid password');
    return;
  }
  req.session.user_id = obj.id;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  /// cheack if email are already in database and is they are emty or not
  if (validateEmail(req.body.email) === true) {
    res.status(401).send('Email is taken');
    return;
  } else if (req.body.email === "" || req.body.password === "") {
    res.status(401).send('Please provide a username and password');
    return;
  }
  let hashPassword = bcrypt.hashSync(req.body.password, 10);/// incrypt password
  let id = generateRandomString();
  users[id] = {id: id, email: req.body.email, password: hashPassword};
  req.session.user_id = id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {/// action for logout button
  req.session = null;
  res.redirect('/login');
});

app.listen(PORT, () => {/// console.log in shell when server is up and going
  console.log(`Example app listening on port ${PORT}!`);
});