const getUser = function(email, database) {
  for (let i of Object.keys(database)) {
    if (database[i].email === email) {
      return database[i];
    }
  }
  return false;
};

module.exports = { getUser }

// const getUser = (email) => {/// using email to grab the right object and return it
//   for (let i of Object.keys(users)) {
//     if (users[i].email === email) {
//       return users[i];
//     }
//   }
//   return false;
// };