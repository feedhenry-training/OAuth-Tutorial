
function FHOAuth1User(user, provider) {

  if (user == undefined || user == null) {
    $fh.log( {
      message : 'New Auth1 user creation.'
    });
    user = {};
  }
  this.provider = new FHOAuthProvider(provider) || new FHOAuthProvider();
  this.user_id = user.user_id || 'none';
  this.user_name = user.user_name || 'New User';
  this.request_token = user.request_token || undefined;
  this.request_token_secret = user.request_token_secret || undefined;
  this.access_token = user.access_token || undefined;
  this.access_token_secret = user.access_token_secret || undefined;
  this.device_id = user.device_id || undefined;

  // saving self for closures
  var _self = this;

  $fh.env( {}, function(res) {
    _self.device_id = res.uuid;
  });

}

FHOAuth1User.prototype.toString = function() {
  return this.provider.provider_name + '_' + this.user_name;
};

/**
 * Check if the users instance is authorized
 */
FHOAuth1User.prototype.isValidAccessToken = function() {

  if (!this.access_token || !this.access_token_secret) {
    return false;
  }
  return true;
};

/**
 * Usually called after used clicked 'Login' button.
 * Opens browser and redirects user to the login page where user is asked to
 * authenticate herself/himself with the provider (log in) and authorize the
 * application to allow acting on her/his behalf.
 * 
 * @param callback
 *          Function to be executed after login and authorization is successful.
 * @param errback
 *          Function to be executed if browser can't be opened, or auth fails.
 */

FHOAuth1User.prototype.browserLogin = function(callback, errback) {

  var _this = this;
  
  
  //trigger server side oauth process to obtain the request token from
  //the oauth provider
  $fh.act( {
      act : this.provider.request_token_url,
      req : {
        user : _this
      }
      }, function(res) {

        // res should contan request token
        if (res.error) {

          $fh.log( {
            message : 'Invalid request access token'
          });
          return;

        }

        //redirect user to the login page
        $fh
            .webview( {
              'url' : _this.provider.paths['login'] + res.token.oauth_token
            });

        // start requesting the token
        // allow 3 seconds for user to be subscribed
        setTimeout(function() {
          _this.requestAuthDetails(callback);
        }, 3000);

      }, function() {

      });

};

/**
 * Makes calls to the server-side to confirm if the your application is authorized.
 * The arguments usually are passed in form the browserLogin function.
 * 
 * Depending on the server reply, it then takes the following actions: 
 * on status 'waiting' : function calls itself 
 * on status 'authorized' : function persist the new user details and calls onAuthorization
 * 
 * @param callback
 *          Function to be executed after login and authorization is successful.
 * @param errback
 *          Function to be executed if auth fails.
 * 
 */
FHOAuth1User.prototype.requestAuthDetails = function(callback, errback) {

  // store reference to self in case we need to use it in callback function
  // scope
  var _this = this;

  // call server to get auth status
  $fh.act( {
  act : 'oauth_status',
  req : {
    user : _this
  }
  },
  // server replied with status
  function(res) {
    if (res == null || !res.status) {
      $fh.log( {
        message : 'Invalid response to oauth_status request'
      });
      return;
    }
    $fh.log( {
      message : 'User status: ' + res.status
    });
    if (res.status == "waiting") {
      // start requesting the token again
      setTimeout(function() {
        _this.requestAuthDetails(callback);
      }, 1000);
      return;
    } else if (res.status == "authorized") {
      // save user details
      // we need to keep the 'New User', therefore the auth user must be cloned 
      // and saved
      var new_user;
      if (_this.user_name == "New User") {
        new_user = new FHOAuth1User( {}, _this.provider);

        for ( var attr in _this) {
          if (_this.hasOwnProperty(attr))
            new_user[attr] = _this[attr];
        }
        new_user.user_name = res.user_name_new;
        new_user.user_id = res.user_id;
        new_user.access_token = res.access_token;
        new_user.access_token_secret = res.access_token_secret;
        userManager.addUser(new_user);
      } else {
        _this.user_name = res.user_name_new;
        _this.user_id = res.user_id;
        _this.access_token = res.access_token;
        _this.access_token_secret = res.access_token_secret;
      }

      userManager.onAuthorization((new_user || _this), callback);

      userManager.saveUsers();

      return;
    }

  },
  // server error when querying user

  function(res) {
    $fh.log( {
      message : 'Invalid response to oauth_status request.'
    });
  });

};