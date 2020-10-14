import React from 'react';
import ReactDOM from 'react-dom'; 
import './App.css';
import $ from 'jquery';


class Album extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
  //the message to display at top of the page
      loginErrorMsg : "iAlbum",

  // a boolean flag indicating whether the user has logged in
      notLogin : true,

  // the string displayed in the button that is used to login/logout
      logButtonString : "log in",

  // this variable stores the name and id of the logged-in user
      currentUser :{'username':'', '_id':''},

  // this variable stores the name and id of the user whose name is clicked in the left division
      selectedUser : {'username':'', '_id':''},

  // this array variable stores the friends of the logged-in user
  // each element in this array has the same structure with currentUser variable
      friends : [],

  // this boolean flag controls whether the webpage displays enlarged photo
      showBigPhoto :false,

  // This variable stores all the photos of a user
      userPhotos : [],

  // This variable stores basic information about the photo that is enlarged and dislayed
      photoBeingDisplayed :{'_id':'', 'url':'', 'friendListString':'', 'likedby':[]},

  // This boolean flag indicates whether the logged-in user is cliked in the left division
      isCurrentUser : false,

  // This variable stores user name and password input  
      userInput:{'username':'','password':''}
    };
	
    this.handleLoginLogout = this.handleLoginLogout.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.showUserPhotos = this.showUserPhotos.bind(this);
    this.goToBigPhoto = this.goToBigPhoto.bind(this);
    this.deletePhoto = this.deletePhoto.bind(this);
    this.likePhoto =this.likePhoto.bind(this);
    this.goToSmallPhotos = this.goToSmallPhotos.bind(this);
    this.uploadFile=this.uploadFile.bind(this);
  }


  componentDidMount() {
    this.pageLoad();
  }  


  pageLoad() {
    $.ajax({
        url: "http://localhost:3002/init",
        dataType: 'json', 
        xhrFields: {
            withCredentials: true
        },     
        success: function(data) {
          
		  if(data.msg==""){
            this.setState({
              loginErrorMsg:"iAlbum",
              notLogin:true,
              logButtonString:"log in",
              currentUser:{'username':'', '_id':''},
              selectedUser:{'username':'', '_id':''},
              friends:[],
              showBigPhoto:false,
              userPhotos:[],
              photoBeingDisplayed:{'_id':'', 'url':'', 'friendListString':'', 'likedby':[]},
              isCurrentUser:false,
			  userInput:{'username':'','password':''}
            });

          }else{
            if(data.the_user){
              this.setState({
                notLogin:false,
                logButtonString:"log out",
                currentUser:{'username':data.the_user, '_id':'0'},
                friends:data.friend_list,
                showBigPhoto:false,
                userPhotos:[],
              });

            }else{
              alert(data.msg);
            }
          }
        }.bind(this),
        error: function (xhr, ajaxOptions, thrownError) {
			
            alert("load error");
            alert(xhr.status);
            alert(thrownError);
			
        }.bind(this)
    });
  }


  handleLoginLogout(e){
    if(this.state.notLogin == true){
      if((this.state.userInput.username=="")||(this.state.userInput.password=="")){
        // generate alerts in case that the user doesn't fill in username or password
        alert("You must enter username and password");
      }
      else{
        $.ajax({
          url: "http://localhost:3002/login",
          type:"POST",
          data:{'username':this.state.userInput.username, 'password':this.state.userInput.password},
          dataType: 'json',
          xhrFields: {
              withCredentials: true
          },  
          success: function(data) {
            if(data.msg === "Login failure"){
              // if the login fails, display the response message
              // alongside the "iAlbum" header
              this.setState({
                  loginErrorMsg:"iAlbum "+data,
              });
            }
            else{
              if(data.friend_list){

                this.setState({
                  notLogin:false,
                  loginErrorMsg:"iAlbum",
                  logButtonString:"log out",
                  currentUser:{'username':this.state.userInput.username,'_id':'0'},
                  friends:data.friend_list
                });

              }
              else{
                alert(data.msg);
              }
            }
          }.bind(this),
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Error login.");
                alert(xhr.status);
                alert(thrownError);
            }.bind(this)
        });
      }
    }
    else{
      $.ajax({
        url: "http://localhost:3002/logout",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },  
        success: function(data) {
          if(data.msg===""){
            this.setState({
              loginErrorMsg:"iAlbum",
              notLogin:true,
              logButtonString:"log in",
              currentUser:{'username':'', '_id':''},
              selectedUser:{'username':'', '_id':''},
              friends:[],
              showBigPhoto:false,
              userPhotos:[],
              photoBeingDisplayed:{'_id':'', 'url':'', 'friendListString':'', 'likedby':[]},
              isCurrentUser:false,
              userInput:{'username':'','password':''}
            });

          }
        }.bind(this),
          error: function (xhr, ajaxOptions, thrownError) {
              alert(xhr.status);
              alert(thrownError);
          }.bind(this)
      });
    }
  }


  handleUsernameChange(username){
    this.setState({
      userInput:{'username':username,'password':this.state.userInput.password}
    });
  }


  handlePasswordChange(password){
    this.setState({
      userInput:{'username':this.state.userInput.username,'password':password}
    });
  }
  
  
  showUserPhotos(user){
    if(user._id == '0'){
      // the login user's album is clicked. By setting this flag to true
      // we can delete/upload photos
      this.setState({
        isCurrentUser:true
      });
    }
    else{
      // Album of a friend of the login user is clicked. By setting this flag
      // to false, we can only like this user.
      this.setState({
        isCurrentUser:false
      });
    }

    // we should not display enlarged photo, set this flag to false
    // save the clicked user's information to selectedUser
    this.setState({
      showBigPhoto:false,
      selectedUser:user
    });


    $.ajax({
        url: "http://localhost:3002/getalbum/"+user._id,
        dataType: 'json', 
        xhrFields: {
            withCredentials: true
        },     
        success: function(data) {
          if (data.photo_list){
            this.setState({
              userPhotos:[],
            });
            for(var index in data.photo_list){
              // save the information of each photo to the userPhotos list]
				
              var photo = data.photo_list[index];

              // generate the string showing who likes this photo.
              var displayString = (photo.likedby.length == 0) ? "" : (photo.likedby.join(', ')+" liked this photo!");
              var tmp = this.state.userPhotos
              tmp.push({'_id':photo._id, 'url':photo.url, 'likedby':photo.likedby,'friendListString':displayString});
              this.setState({
              	userPhotos:tmp,
              });
            }
          }
          else{
            alert(data.msg);
          }
        }.bind(this),
        error: function (xhr, ajaxOptions, thrownError) {
            alert("Error getting photos for current user.");
            alert(xhr.status);
            alert(thrownError);
        }.bind(this)
    });
  }


  uploadFile(){
    var f = document.getElementById('imgFile').files[0];

     if (f) {
          // upload the photo to the server
      $.ajax({
          url: "http://localhost:3002/uploadphoto",
          dataType: 'json',
          data:f, 
          type:"POST",
          cache:false,
          contentType: false,
          processData: false,
          xhrFields: {
              withCredentials: true
          },     
          success: function(data) {
            if (data._id){
              // newly uploaded photo has no likedby and empty friendListring.
              var tmp = this.state.userPhotos;
              tmp.push({'_id':data._id, 'url':data.url, 'likedby':[], 'friendListString':""});
              this.setState({
                userPhotos:tmp
              });
              document.getElementById('imgFile').value = null;
            }
            else{
              alert(data.msg);
            }
          }.bind(this),
          error: function (xhr, ajaxOptions, thrownError) {
              alert("Error upload photo.");
              alert(xhr.status);
              alert(thrownError);
          }.bind(this)
      });
      
     }
  }
  

  deletePhoto(photo){
    var confirmation = window.confirm('Are you sure you want to delete this photo?');
    if(confirmation == true){
      // send the id of the photo to delete to the server
      $.ajax({
          url: "http://localhost:3002/deletephoto/"+photo._id,
          dataType: 'json', 
          type:"DELETE",
          xhrFields: {
              withCredentials: true
          },     
          success: function(data) {
            if (data.msg === ""){
              // the deletion on the server side is successful
              // now find out the index of the deleted photo within the userPhotos list
              var splice_index = 0;
              for(var index in this.state.userPhotos){
                if(this.state.userPhotos[index]._id == photo._id){
                  splice_index = index;
                }
              }

              // use the built-in splice function of JS array to
              // delete the photo at position splice_index.
              var tmp = this.state.userPhotos;
              tmp.splice(splice_index, 1);
              this.setState({
                userPhotos:tmp,
              });
			  
              if(this.state.showBigPhoto == true){
                // here, if the deleted photo is the enlarged photo,
                // we need to display small photos.
                this.goToSmallPhotos();
              }
            }
            else {
             alert(data.msg);
            }
          }.bind(this),
          error: function (xhr, ajaxOptions, thrownError) {
              alert("Error deleting photo.");
              alert(xhr.status);
              alert(thrownError);
          }.bind(this)
      });
    }
  }
  
  
  likePhoto(photo){
    if(photo.likedby.indexOf(this.state.currentUser.username)==-1){
      // if the login user has not liked the photo before,
      // generate an http request to the server to update the likedby list
      $.ajax({
          url: "http://localhost:3002/updatelike/"+photo._id,
          dataType: 'json', 
          type:"PUT",
          xhrFields: {
              withCredentials: true
          },     
          success: function(data) {
            if(data.like_list){
              // update the friendListString

              var splice_index = 0;
              for(var index in this.state.userPhotos){
                if(this.state.userPhotos[index]._id == photo._id){
                  splice_index = index;
                }
              }
              photo.friendListString = data.like_list.join(', ')+" liked this photo!";
              photo.likedby = data.like_list;
              var tmp = this.state.userPhotos;
              tmp[splice_index] = photo;
              this.setState({
                userPhotos:tmp,
              });
            }
            else{
              alert(data.msg);
            }
          }.bind(this),
          error: function (xhr, ajaxOptions, thrownError) {
              alert("Error like photo.");
              alert(xhr.status);
              alert(thrownError);
          }.bind(this)
      });
    }
  }
  
  
  goToBigPhoto(photo){
    this.setState({
      showBigPhoto:true,
      photoBeingDisplayed:photo
    });
  }
  
  
  goToSmallPhotos(){
    this.setState({
      showBigPhoto:false,
	  photoBeingDisplayed:{'_id':'', 'url':'', 'friendListString':'', 'likeby':[]}
    });
	
	this.showUserPhotos(this.state.selectedUser);
  }
  
  
  render() {
    return (
      <div id="topLevel">
        <Header
          loginErrorMsg={this.state.loginErrorMsg}
          notLogin = {this.state.notLogin}
          userInput = {this.state.userInput}
          currentUser = {this.state.currentUser}
          logButtonString={this.state.logButtonString}
          handleLoginLogout = {this.handleLoginLogout}
          handleUsernameChange = {this.handleUsernameChange}
          handlePasswordChange = {this.handlePasswordChange}/>
        <Content
          friends = {this.state.friends}
          currentUser = {this.state.currentUser}
          notLogin = {this.state.notLogin}
          selectedUser = {this.state.selectedUser}
          showBigPhoto = {this.state.showBigPhoto}
          photoBeingDisplayed = {this.state.photoBeingDisplayed}
          userPhotos = {this.state.userPhotos}
          isCurrentUser={this.state.isCurrentUser}

          showUserPhotos={this.showUserPhotos}
          goToBigPhoto = {this.goToBigPhoto}
          deletePhoto = {this.deletePhoto}
          likePhoto ={this.likePhoto}
          goToSmallPhotos = {this.goToSmallPhotos}
          uploadFile={this.uploadFile}

          />
      </div>
    );
  }
}


class Header extends React.Component{
  constructor(props) {
    super(props);
    this.handleLoginLogout = this.handleLoginLogout.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
  }
  handleLoginLogout(e){
    this.props.handleLoginLogout(e);
  }

  handleUsernameChange(e){
    this.props.handleUsernameChange(e.target.value);

  }

  handlePasswordChange(e){
    this.props.handlePasswordChange(e.target.value);
  }

  render() {
    return (
      <div id="header">
        <h1>{this.props.loginErrorMsg}</h1>
        {this.props.notLogin ? <h3>Username</h3> : null }
        {this.props.notLogin ? <input type="text"
            placeholder = " username"
            value={this.props.userInput.username}
            onChange={this.handleUsernameChange}
          ></input>: null}
        {this.props.notLogin ? <h3>Password</h3> : null }
        {this.props.notLogin ? <input type="text"
            placeholder = " password"
            value={this.props.userInput.password}
            onChange={this.handlePasswordChange}
          ></input>: null} 
        {this.props.notLogin ? null: <h3 >Hello {this.props.currentUser.username}!</h3>}
        <button onClick={this.handleLoginLogout}>{this.props.logButtonString}</button>
      </div>
    );
  }
}


class Content extends React.Component{
  constructor(props) {
    super(props);
    this.showUserPhotos = this.showUserPhotos.bind(this);
    this.goToBigPhoto = this.goToBigPhoto.bind(this);
    this.deletePhoto = this.deletePhoto.bind(this);
    this.likePhoto =this.likePhoto.bind(this);
    this.goToSmallPhotos = this.goToSmallPhotos.bind(this);
    this.uploadFile=this.uploadFile.bind(this);
  }

  showUserPhotos(user){
    this.props.showUserPhotos(user);
  }
  
  goToBigPhoto(photo){
    this.props.goToBigPhoto(photo);
  }
  
  deletePhoto(photo){
    this.props.deletePhoto(photo);
  }
  
  likePhoto(photo){
    this.props.likePhoto(photo);
  }
  
  goToSmallPhotos(){
    this.props.goToSmallPhotos();
  }
  
  uploadFile(){
    this.props.uploadFile();
  }

  render() {
    return (
      <div id="content">
      <NameList
        selectedUser = {this.props.selectedUser}
        currentUser ={this.props.currentUser}
        friends = {this.props.friends}
        notLogin ={this.props.notLogin}
        showUserPhotos = {this.showUserPhotos}/>
      
      <AlbumDisplay
        showBigPhoto = {this.props.showBigPhoto}
        photoBeingDisplayed = {this.props.photoBeingDisplayed}
        userPhotos = {this.props.userPhotos}
        isCurrentUser={this.props.isCurrentUser}

        goToBigPhoto = {this.goToBigPhoto}
        deletePhoto = {this.deletePhoto}
        likePhoto ={this.likePhoto}
        goToSmallPhotos = {this.goToSmallPhotos}
        uploadFile={this.uploadFile}/>
      </div>
    );
  }
}


class NameList extends React.Component{
  constructor(props){
    super(props);
    this.showUserPhotos = this.showUserPhotos.bind(this);
  }

  showUserPhotos(user){
    this.props.showUserPhotos(user);
  }

  render() {
    let rows = [];
    this.props.friends.map((friend) => {
        rows.push(
          <AlbumEntry
            showUserPhotos = {this.showUserPhotos}
            friend = {friend}
            selectedUser = {this.props.selectedUser}/>
        );
    });

    return (
      <div id="nameList">
        <ul>
          {this.props.notLogin?null:<li>
            <h3 onClick={() => this.showUserPhotos(this.props.currentUser)} className={(this.props.currentUser._id === this.props.selectedUser._id)?'selected':''} id={this.props.currentUser._id}>My Album</h3>
          </li>}
          {rows}
        </ul>
      </div>
    );
  }
}

class AlbumEntry extends React.Component{
  constructor(props) {
    super(props);
    this.showUserPhotos = this.showUserPhotos.bind(this);
  }
  
  showUserPhotos(user){
    this.props.showUserPhotos(user);
  }
  
  render() {
    return (
          <li>
            <h3 onClick={() => this.showUserPhotos(this.props.friend)} className={(this.props.friend._id === this.props.selectedUser._id)?'selected':''}  id={this.props.friend._id}> {this.props.friend.username}s Album</h3>
		 </li>
    );
  }

}


class AlbumDisplay extends React.Component{
  constructor(props) {
    super(props);
    this.goToBigPhoto = this.goToBigPhoto.bind(this);
    this.deletePhoto = this.deletePhoto.bind(this);
    this.likePhoto =this.likePhoto.bind(this);
    this.goToSmallPhotos = this.goToSmallPhotos.bind(this);
    this.uploadFile=this.uploadFile.bind(this);
  }
  
  goToBigPhoto(photo){
    this.props.goToBigPhoto(photo);
  }
  
  deletePhoto(photo){
    this.props.deletePhoto(photo);
  }
  
  likePhoto(photo){
    this.props.likePhoto(photo);
  }
  
  goToSmallPhotos(){
    this.props.goToSmallPhotos();
  }
  
  uploadFile(){
    this.props.uploadFile();
  }

  render() {
    let rows = [];
    this.props.userPhotos.map((photo) => {
        rows.push(
            <div className="smallPhotoBlock">
              <img src={photo.url} onClick={() => this.goToBigPhoto(photo)} id={photo._id}></img>
              <h3>{photo.friendListString}</h3>
              {this.props.isCurrentUser?<button onClick={() => this.deletePhoto(photo)}>Delete</button>:null}
              {this.props.isCurrentUser?null:<button onClick={() => this.likePhoto(photo)}>Like</button>}
            </div>
        );
    });

    return (
      <div id="albumDisplay">
          {this.props.showBigPhoto?
			  <div id="bigPhoto">
            	<img id="backCross" src="/images/x.jpg" onClick={this.goToSmallPhotos}></img>
            	<img className="largePhoto" src={this.props.photoBeingDisplayed.url} id={this.props.photoBeingDisplayed._id}></img>
            	<h3>{this.props.photoBeingDisplayed.friendListString}</h3>
            	{this.props.isCurrentUser?<button onClick={() => this.deletePhoto(this.props.photoBeingDisplayed)}>Delete</button>:null}
            	{this.props.isCurrentUser?null:<button onClick={() => this.likePhoto(this.props.photoBeingDisplayed)}>Like</button>}
          	  </div>
				:
			  <div id="smallPhotos">
            	{rows}
			  </div>}

          {(!this.props.showBigPhoto)&&(this.props.isCurrentUser)?<div id="fileSelection">
            <div id="fillUp"></div>
            <input type="file" id="imgFile"/>
            <button onClick={this.uploadFile}>Upload Photo</button>
          </div>:null}
      </div>
    );
  }
}


export default Album;
