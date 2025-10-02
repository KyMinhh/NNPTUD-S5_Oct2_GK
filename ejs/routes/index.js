var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({
    message: 'Welcome to NNPTUD-S5 API',
    version: '1.0.0',
    endpoints: {
      users: '/users',
      roles: '/roles'
    }
  });
});

module.exports = router;
