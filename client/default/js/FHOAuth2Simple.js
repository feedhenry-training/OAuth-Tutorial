
function FHOAuth2User(user, provider) {

  if (user == undefined || user == null) {
    $fh.log( {
      message : 'New Auth2 user creation.'
    });
    user = {};
  }
  this.provider = new FHOAuthProvider(provider) || new FHOAuthProvider();
  this.user_id = user.user_id || 'none';
  this.user_name = user.user_name || 'New User';
  this.access_code = user.access_code || undefined;
  this.access_token = user.access_token || undefined;
  this.access_expiry = user.access_expiry || {};
  this.device_id = user.device_id || undefined;

  // saving self for closures
  var _self = this;

  $fh.env( {}, function(res) {
    _self.device_id = res.uuid;
  });

}

FHOAuth2User.prototype.toString = function() {
  return this.provider.provider_name + '_' + this.user_name;
};

/**
 * Check if the users instance is authorized
 */
FHOAuth2User.prototype.isValidAccessToken = function() {

  if (!this.access_token) {
    return false;
  } else if (this.access_expiry.year) {
    var currentDate = new Date();
    var expiryDate = new Date(this.access_expiry.year, this.access_expiry.month, this.access_expiry.date, this.access_expiry.hour, this.access_expiry.minute, this.access_expiry.second);
    if (expiryDate < currentDate) {
      return false;
    }
  }
  return true;
};

/**
 * Helper function that populates provider path's variables with the user properies' values
 */
FHOAuth2User.prototype.buildUrl = function(path_name, params) {

  if (this.provider == undefined) {
    $fh.log( {
      message : 'No provider specified to build url for.'
    });
    return undefined;
  }

  var url = this.provider.paths[path_name] || "";

  for ( var p in this.provider) {
    if (p != undefined) {
      url = url.replace('{' + p + '}', (this.provider[p]) || "");
    }
  }

  for ( var p in this) {
    if (p != undefined) {
      url = url.replace('{' + p + '}', (this[p]) || "");
    }
  }
  if (params == undefined) {
    return url;
  }
  for ( var p in params) {
    if (p != undefined) {
      url = url.replace('{' + p + '}', (params[p]) || "");
    }
  }
  return url;

};

/**
 * Opens browser and redirects user to the login page where user is asked to
 * authenticate herself/himself with the provider (log in) and authorize the
 * application to allow acting on her/his behalf.
 *
 * @param callback
 *          Function to be executed after browser opens. NOTE: there is no way
 *          to know if the url is correct at this point.
 * @param errback
 *          Function to be executed if browser can't be opened, or other error.
 */

FHOAuth2User.prototype.browserLogin = function(callback, errback) {

  var _this = this;

  var loginUrl = this.buildUrl('login');

  //Please refer to this post why we cant use ?param1=value1&param2=value2
  //when using Facebook OAuth 2.0
  // http://stackoverflow.com/questions/4386691/facebook-error-error-validating-verification-code
  var urlQuery = '/{device_id}/{user_name}';
  urlQuery = urlQuery
      .replace('{user_name}', encodeURIComponent(this.user_name));
  urlQuery = urlQuery.replace('{device_id}', this.device_id);

  loginUrl = loginUrl.replace('{querystring}', urlQuery);

  if (loginUrl == undefined) {
    $fh.log( {
      message : 'Wrong login url.'
    });
    if (errback != undefined && errback != null) {
      errback();
    }
    return;
  }

  $fh.log( {
    message : 'Facebook login url: ' + loginUrl
  });

  $fh.webview( {
    'url' : loginUrl
  });

  // assumming browser opened successfully
  // notify server that user initiated login
  $fh.act( {
  act : 'oauth_subscribe',
  req : {
    user : _this
  }
  },
  // server subscribed user

  function(res) {
    (res.status == "waiting") ? $fh.log( {
      message : 'User subscribed to server auth waiting queue.'
    }) : $fh.log( {
      message : 'User can not be subscribed to server auth waiting queue.'
    });
  },
  // server error when subscribing user

  function(res) {
    $fh.log( {
      message : 'Error subscribing to server auth waiting queue.'
    });
  });

  // start requesting the token
  // allow 3 seconds for subscribe req to go first

  setTimeout(function() {
    _this.requestAuthDetails(callback);
  }, 3000);

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
FHOAuth2User.prototype.requestAuthDetails = function(callback) {

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
          // if reauth user

          var new_user;
          if (_this.user_id == "none") {
            new_user = new FHOAuth2User( {}, providers[_this.provider.provider_name]);

            for ( var attr in _this) {
              if (_this.hasOwnProperty(attr))
                new_user[attr] = _this[attr];
            }
            new_user.user_name = res.user_name_new;
            new_user.user_id = res.user_id;
            new_user.access_token = escape(res.access_token);
            new_user.access_expiry = res.access_expiry;
            userManager.addUser(new_user);
          } else {
            _this.user_name = res.user_name_new;
            _this.user_id = res.user_id;
            _this.access_token = escape(res.access_token);
            _this.access_expiry = res.access_expiry;
          }

          userManager.onAuthorization((new_user || _this), callback);

          userManager.saveUsers();

          return;
        }

      },
      // server error when subscribing user

      function(res) {
        $fh.log( {
          message : 'Error subscribing to server auth waiting queue.'
        });
      });

};