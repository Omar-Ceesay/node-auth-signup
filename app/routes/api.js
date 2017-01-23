var express = require('express');
var router = express.Router();
var usersController = require('../../controllers/usersController.js');

module.exports = function(router, passport){

  router.get('/:resource', function(req, res, next){
    var resource = req.params.resource;

    if(resource == 'people'){
      usersController.find(req.query, function(err, results){
        if(err){
            res.json({
              confirmation: 'fail',
              message: err
            })

            return
        }

        res.json({
          confirmation: 'success',
          results: results
        })
      })
    }
  });
}
