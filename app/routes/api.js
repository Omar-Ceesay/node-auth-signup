var express = require('express');
var router = express.Router();
var request = require('superagent');
var fileController = require('../../controllers/fileController');

module.exports = function(router, passport){

  router.get('/:resource', function(req, res, next){

    var resource = req.params.resource;

    if(resource == 'files'){
      fileController.find(req.query, function(err, results){
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
};
