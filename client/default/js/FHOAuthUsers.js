function FHOAuthProvider(provider) {
  
  // saving self for callback scope
  var _self = this;

  if (provider == undefined || provider == null) {
    $fh.log( {
      message : 'New OAuth provider creation.'
    });
    provider = {};
  }
  this.provider_name = provider.provider_name || 'none';
  this.oauth_version = provider.oauth_version || '0';
  this.paths = (provider.paths != undefined && provider.paths != null) ? provider.paths : {};
  
  
  // variable specific to only OAuth 1.0
  this.request_token_url = provider.request_token_url || "";
  
  // variables specific to only OAuth 2.0  
  this.client_id = provider.client_id || undefined;
  this.scope = provider.scope || "";
  this.redirect_uri = provider.redirect_uri || undefined;

  //maping serverside function to http url
  if (this.redirect_uri && this.redirect_uri.indexOf('http') < 0) {
    $fh.act( {
      act : this.redirect_uri
    }, function(res) {
      _self.redirect_uri = encodeURIComponent(res.cloudUrl) + '{querystring}';
    });
  }

}

var userManager = (function() {

  /**
   * Array of users.
   */

  var users = {};
  var current_user = {};


  return {
    
  /**
   * Function initiates the users by loading the data from device local storage.
   * If local storage available, it sets the users object. If local storage
   * unavailable, it prints message to the log.
   *
   */    

  initUsers : function() {

    LocalStorage.load( {
      key : 'oauth_users'
    },
    // on success

    function(obj) {
      if (obj == undefined || obj.val == "" || JSON.parse(obj.val) == null) {
        $fh.log( {
          message : 'No users in local storage.'
        });
        return;
      }
      $fh.log( {
        message : 'Loading users from local storage.'
      });

      var saved_users = JSON.parse(obj.val);
      for ( var p in saved_users) {

        if (!users[p]) {
          users[p] = [];
        }
        for ( var u = 0; u < saved_users[p].length; u++) {
          if (saved_users[p][u].provider.oauth_version == '1') {
            users[p].push(new FHOAuth1User(saved_users[p][u], providers[p]));
          } else if (saved_users[p][u].provider.oauth_version == '2') {
            users[p].push(new FHOAuth2User(saved_users[p][u], providers[p]));
          }
        }
      }
    },
    // on error

    function() {
      $fh.log( {
        message : 'Error loading users from local storage.'
      });
    });

  },

  saveUsers : function() {

    LocalStorage.save( {
    key : 'oauth_users',
    val : users
    },
    // users saved

    function() {
      $fh.log( {
        message : 'Saving users in requestAuthDetails' + JSON.stringify(users)
      });
    },
    // error saving users

    function(err) {
      $fh.log( {
        message : 'Error persisting users in requestAuthDetails ' + err
      });
    });

  },

  /**
   * Adds new user object to the array of users. This function takes only one
   * parameter, which is the FHOAuthxUser object. User must be associated with
   * the provider or will be rejected.
   * 
   * @param user
   *          The implementation of FHOAuthxUser
   * 
   */
  addUser : function(user) {

    if (user == undefined || user.provider.provider_name == undefined) {
      $fh.log( {
        message : 'Adding invalid user.'
      });
      return;
    }

    if (users[user.provider.provider_name] == undefined) {
      users[user.provider.provider_name] = [];
    }
    users[user.provider.provider_name].push(user);

  },

  /**
   * Is being executed when the user authorizes the app. Sets the current user.
   * And executes successful callback.
   * 
   * 
   * @param user
   *          The implementation of FHOAuth2User
   * @param callback
   *          Function to be executed after login and authorization is successful.
   */

  onAuthorization : function(user, callback) {

    if (user == undefined || user.provider.provider_name == undefined || user.device_id == undefined) {
      $fh.log( {
        message : 'Invalid user in onAuthorization.'
      });
      return;
    }

    if (current_user[user.provider.provider_name] == undefined) {

      current_user[user.provider.provider_name] = {};

    }

    current_user[user.provider.provider_name] = user;

    userManager.saveUsers();

    // do callback if required
    if (callback != undefined && callback != null) {
      callback();
    }

  },

  /**
   * Changes current user per specified provider. This may occur when you want
   * to add a new user or switch between users.
   * 
   * @param provider_name
   *          The name of the provider.
   * @param user_name
   *          The user name.
   */

  changeCurrentUser : function(provider_name, user_name) {

    if (provider_name == undefined || user_name == undefined) {
      $fh.log( {
        message : 'Invalid details to change current user.'
      });
      return;
    }

    if (users[provider_name] == undefined) {
      $fh.log( {
        message : 'No user found for specified provider to change user.'
      });
      return;
    }

    for ( var u = 0; u < users[provider_name].length; u++) {
      if (users[provider_name][u].user_name == user_name) {
        current_user[provider_name] = users[provider_name][u];
      }
    }

  },

  /**
   * All reqests to the OAuth 2.0 API are made through this generic function.
   * To make the request following details are needed:
   *
   * @param user
   *          The user object that requested the data.
   * @param params
   *          Additional params that should be included in the request.    
   *          The params are in the form of object with { key1 : 'value1', key2 : 'value2'}                
   * @param path_name
   *          The name of the providers path to use. The path is accessed by calling:
   *          user.provider.paths['path_name']
   * @param callback
   *          Function to be executed after request return data (is successful)
   * @param errback
   *          Function to be executed if request fails.    
   */    
    
  callOAuth2 : function(user, params, path_name, callback, errback) {

    //
    if (!user.isValidAccessToken()) {
      $fh.log( {
        message : 'Invalid auth details to make a call.'
      });
      alert('User not authorized, please log in with given provider.');
      return;
    }

    var callUrl = user.buildUrl(path_name, params);
    if (callUrl == undefined) {
      $fh.log( {
        message : 'Wrong call url.'
      });
      if (errback != undefined && errback != null) {
        errback();
      }
      return;

    }

    $fh.log( {
      message : 'Calling url: ' + callUrl
    });

    $fh.web( {
      'url' : callUrl
    }, callback || function() {
    }, errback || function() {
    });

  },
    
    
  /**
   * All reqests to the OAuth 1.0 API are made through this generic function.
   * To make the request following details are needed:
   *
   * @param user
   *          The user object that requested the data.
   * @param params
   *          Additional params that should be included in the request.    
   *          The params are in the form of object with { key1 : 'value1', key2 : 'value2'}                
   * @param path_name
   *          The name of the providers path to use. The path is accessed by calling:
   *          user.provider.paths['path_name']
   * @param callback
   *          Function to be executed after request return data (is successful)
   * @param errback
   *          Function to be executed if request fails.    
   */     

  callOAuth1 : function(user, params, path_name, callback, errback) {

    if (!user.isValidAccessToken()) {
      $fh.log( {
        message : 'Invalid auth details to make a call.'
      });
      alert(JSON.stringify(user));
      alert('User not authorized, please log in with given provider.');
      return;
    }

    var action = user.provider.paths[path_name];
    if (action == undefined) {
      $fh.log( {
        message : 'Wrong action url.'
      });
      if (errback != undefined && errback != null) {
        errback();
      }
      return;

    }


    $fh.act( {
    'act' : action,
    'req' : {
    user : user,
    params : params
    }
    }, callback || function() {
    }, errback || function() {
    });

  },

    
    
  logout : function(provider_name, user_name) {

    if (provider_name == undefined || user_name == undefined) {
      $fh.log( {
        message : 'Invalid details to logout user.'
      });
      return;
    }

    if (users[provider_name] == undefined) {
      $fh.log( {
        message : 'No user found for specified provider to logout.'
      });
      return;
    }

    current_user[provider_name] = {};

  },
                   
                   

  getUsersByProvider : function(provider_name) {

    if (provider_name == undefined) {
      $fh.log( {
        message : 'No provider specifed to return users'
      });
      return;
    }

    if (!users || !users[provider_name]) {
      $fh.log( {
        message : 'No users found for specified provider to return.'
      });
      return;
    }

    return users[provider_name];

  },

  getCurrentUserByProvider : function(provider_name) {

    if (provider_name == undefined) {
      $fh.log( {
        message : 'No provider specifed to return current user.'
      });
      return;
    }

    if (current_user[provider_name] == undefined) {
      $fh.log( {
        message : 'No current user found for specified provider.'
      });
      return;
    }

    return current_user[provider_name];

  },

  getUser : function(provider_name, user_name) {

    if (provider_name == undefined || user_name == undefined) {
      $fh.log( {
        message : 'No provider or user name specifed.'
      });
      return;
    }

    if (users[provider_name] == undefined) {
      $fh.log( {
        message : 'No current user found for specified provider.'
      });
      return;
    }

    for ( var u = 0; users[provider_name].length; u++) {
      if (users[provider_name][u].user_name == user_name) {
        return users[provider_name][u];
      }
    }

    return;

  }
  }

})();

