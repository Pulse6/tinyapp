const { assert } = require('chai');

const { getUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUser("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.deepEqual(expectedOutput, user.id);
  });
  it('should returns undefined with a non-existent email', function() {
    const user = getUser("123@123.com", testUsers)
    const expectedOutput = undefined;
    assert.deepEqual(expectedOutput, user.email);
  });
});