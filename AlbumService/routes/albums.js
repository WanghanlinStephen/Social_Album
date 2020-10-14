var express = require('express');
var router = express.Router();
var cors = require('cors');
var fs = require('fs');


var corsOptions = {
    "origin": "http://localhost:3000",
    "credentials":true
}


router.get('/init', cors(corsOptions),function(req, res) {

  if(req.cookies.userID){
    var db = req.db;
    var user_list_collection = db.get("userList");
    //var friend_list = [];

    // first find out the user with userID specified in the cookie
    user_list_collection.find({'_id':req.cookies.userID}, {}, function(error, the_user){
      if(error === null){
        var friend_name_list = the_user[0].friends;

        // the friend_name_list is an array containing all the friend names
        // of the current user. Now we make a query to get
        // all the users from the collection
        user_list_collection.find({ 'username': { $in: friend_name_list }}, {}, function(error, users){
          if(error === null){
            var friend_list = users.map(function (user) {
              return {'username':user.username,"_id":user._id}
            });
            res.json({'the_user':the_user[0].username, 'friend_list':friend_list});
          }
          else{
            res.send({msg:error});
          }
        });
      }
      else{
        // a query error happens
        res.send({msg:error});
      }
    });
  }
  else{
    res.send({msg:""});
  }
});


router.post('/login', cors(corsOptions),function(req, res) {

  var db = req.db;
  var user_list_collection = db.get("userList");
  
  user_list_collection.find({'username':req.body.username}, {}, function(error, login_user){
    if(error === null){
      if((login_user.length>0)&&(login_user[0].password==req.body.password)){
        // the username and password match those stored in the database
        // we should set up the cookie for the user
        var milliseconds = 3600 * 1000;
        res.cookie('userID', login_user[0]._id, { maxAge: milliseconds });

        // continue to get the friend list for this user
        var friend_name_list = login_user[0].friends;

        user_list_collection.find({ 'username': { $in: friend_name_list }}, {}, function(error, users){
          if(error === null){
            var friend_list = users.map(function (user) {
              return {'username':user.username,"_id":user._id}
            });

            res.json({'friend_list':friend_list});
          }
          else{
            res.clearCookie('userID');
            res.send({msg:error});
          }
        });
      }
      else{
        res.send({msg:"Login failure"});
      }
    }
    else{
      res.send({msg:error});
    }
  });
});


router.get('/logout', cors(corsOptions),function(req, res) {
  res.clearCookie('userID');
  res.send({msg:""});
});


router.get('/getalbum/:userid', cors(corsOptions),function(req, res) {
  var id = req.params.userid;
  var db = req.db;
  var photo_list_collection = db.get("photoList");

  if(id == "0"){
    id = req.cookies.userID;
  }

  // find out all the photos whose userid equals id variable
  photo_list_collection.find({'userid':id}, {}, function(error, docs){
    if(error === null){
      // put all the photos in the photo_list and send a json message back.
	  var photo_list=[];
      for(var index in docs){
        photo_list.push({'_id':docs[index]._id, 'url':docs[index].url, 'likedby':docs[index].likedby});
      }

      res.json({'photo_list':photo_list});
    }
    else{
        res.send({msg:error});
    }
  });
});


router.post('/uploadphoto', cors(corsOptions),function(req, res) {

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // generate a random number
  var random_num_str = getRandomInt(10000000, 90000000).toString();

  // this is the absolute path for storing the received photo
  var path = "./public/uploads/"+random_num_str+".jpg";

  // call the following function to store the received photo
  req.pipe(fs.createWriteStream(path));

  var db = req.db;
  var photo_list_collection = db.get("photoList");
  // update the database
  photo_list_collection.insert({'url':'http://localhost:3002/uploads/'+random_num_str+".jpg", 'userid':req.cookies.userID, 'likedby':[]}, function(error, result){
    if (error === null)
		  res.json({'_id':result._id, 'url':result.url});
	  else
		  res.send({msg:error});
  })
});


router.delete('/deletephoto/:photoid',cors(corsOptions), function(req, res) {

  var db = req.db;
  var photo_list_collection = db.get("photoList");
  var photo_id = req.params.photoid;

  photo_list_collection.find({'_id':photo_id}, {}, function(error, result){
    if(error === null){
      // if the photo to be deleted exist
      var photo_name = result[0].url;

      // delete the photo from the database
      photo_list_collection.remove({'_id':photo_id}, function(error, result){
        if(error === null){
          // continue to remove the file from the disk
          var file_path = "./public/uploads/"+photo_name.split("/")[photo_name.split("/").length-1];
          fs.unlink(file_path, function(err){
            if(err){
              res.send({msg:err});
            }
            else{
              res.send({msg:""});
            }
          });
        }
        else{
          res.send({msg:error});
        }
      });
    }
    else{
      res.send({msg:error});
    }
  });
});


router.put('/updatelike/:photoid',cors(corsOptions), function(req, res) {
  var db = req.db;
  var photo_list_collection = db.get("photoList");
  var photo_id = req.params.photoid;
  
  // find out the photo being liked
  photo_list_collection.find({'_id':photo_id}, {}, function(error, the_photo){
    if(error === null){
      var like_list = the_photo[0].likedby;
      var user_list_collection = db.get("userList");

      // find out the logged-in user
      user_list_collection.find({'_id':req.cookies.userID}, {}, function(error, the_user){
        if(error === null){
          // add the logged-in user's username to the like_list
          var user_name = the_user[0].username;
          like_list.push(user_name);

          // update the like_list to the database

          photo_list_collection.update({'_id':photo_id}, {$set:{'url':the_photo[0].url, 'userid':the_photo[0].userid, 'likedby':like_list}}, function(error, result){
            if(error === null){
              res.send({'like_list':like_list});
            }
            else{
              res.send({msg:error});
            }
          });
        }
        else{
          res.send({msg:error});
        }
      })
    }
    else{
      res.send({msg:error});
    }
  });
});

router.options("/*", cors(corsOptions));

module.exports = router;
