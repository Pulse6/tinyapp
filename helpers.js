const getUser = function(email, database) {
  for (let i of Object.keys(database)) {
    if (database[i].email === email) {
      return database[i];
    }
  }
  return false;
};

const generateRandomString = function() {/// pick 6 in total letter of number and return it to make a unique key
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = { 
  getUser,
  generateRandomString
}