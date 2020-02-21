const getUser = function(email, database) {
  for (let i of Object.keys(database)) {
    if (database[i].email === email) {
      return database[i];
    }
  }
  return false;
};

module.exports = { 
  getUser
}