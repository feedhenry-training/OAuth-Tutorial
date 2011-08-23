var OAuthUsers = (function() {

  return {
  /**
   * Saves a user in the cache with auth status 'waiting'. User can only be
   * saved if the provider_name, device_id and user_name are valid.
   * 
   * @param user
   *          The implementation of FHOAuthxUser
   * @return user Returns user object with changed status
   */

  addUser : function(user) {

    if (user == undefined || user.provider.provider_name == undefined || user.device_id == undefined || user.user_name == undefined) {
      $fh.log( {
        message : 'Invalid user details. Cannot be added cached.'
      });
      user.status = "unknown";
      return user;
    }

    user.status = "waiting";

    $fh
        .log( {
          message : 'Saving user ' + user.user_name + ' with status waiting in the cache.'
        });

    var key = user.provider.provider_name + "_" + user.device_id + "_" + user.user_name;

    $fh.cache( {
    act : "save",
    key : key,
    val : user
    });

    return user;

  },

  /**
   * Called if provider successfuly authorizes the app. Changes the user status
   * in to 'authorized'.
   * 
   * @param provider_name
   *          The provider that authorizes the user
   * @param device_id
   *          UUID of the device that requestes auth
   * @param access_token
   *          Token assied to the app by the provider
   * @param access_expiry
   *          Token exipry date
   * @param user_name
   *          User name in the queue (this may be 'New user' if the user
   *          initiating authorization for your app for the first time)
   * @param user_name_new
   *          The real user name as appears in the provider services
   * @param user_id
   *          The user id number as appears in the provider services
   * @return user Returns updated user object or object with status 'unknown'
   */

  authorizeUserOAuth2 : function(provider_name, device_id, access_token, access_expiry, user_name, user_name_new, user_id) {

    var key = provider_name + "_" + device_id + "_" + user_name;
    var userObj = $fh.cache( {
    act : "load",
    key : key
    });

    var user = (userObj.val == "") ? undefined : $fh.parse(userObj.val);

    if (user == undefined) {
      user = {
        status : 'unknown'
      };
      return user;
    }

    user.status = "authorized";
    user.user_id = user_id;
    user.access_expiry = access_expiry;
    user.access_token = access_token;
    user.user_name_new = user_name_new;

    $fh
        .log( {
          message : 'User and app authorized by ' + provider_name + ' on a device: ' + device_id
        });

    $fh.cache( {
    act : "save",
    key : key,
    val : user
    });

    return user;

  },

  /**
   * Called if provider successfuly authorizes the app. Changes the user status
   * in to 'authorized'.
   * 
   * @param provider_name
   *          The provider that authorizes the user
   * @param device_id
   *          UUID of the device that requestes auth
   * @param access_token
   *          Token assied to the app by the provider
   * @param access_expiry
   *          Token exipry date
   * @param user_name
   *          User name in the queue (this may be 'New user' if the user
   *          initiating authorization for your app for the first time)
   * @param user_name_new
   *          The real user name as appears in the provider services
   * @param user_id
   *          The user id number as appears in the provider services
   * @return user Returns updated user object or object with status 'unknown'
   */

  authorizeUserOAuth1 : function(provider_name, device_id, access_token, access_token_secret, user_name, user_name_new, user_id) {

    var key = provider_name + "_" + device_id + "_" + user_name;
    var userObj = $fh.cache( {
    act : "load",
    key : key
    });

    var user = (userObj.val == "") ? undefined : $fh.parse(userObj.val);

    if (user == undefined) {
      user = {
        status : 'unknown'
      };
      return user;
    }

    user.status = "authorized";
    user.user_id = user_id;
    user.access_token_secret = access_token_secret;
    user.access_token = access_token;
    user.user_name_new = user_name_new;

    $fh
        .log( {
          message : 'User and app authorized by ' + provider_name + ' on a device: ' + device_id
        });

    $fh.cache( {
    act : "save",
    key : key,
    val : user
    });

    return user;

  },

  /**
   * Called if provider denied authorizing the app. Changes the user status to
   * 'denied'.
   * 
   * @param provider_name
   *          The provider that authorizes the user
   * @param device_id
   *          UUID of the device that requestes auth
   * @param user_name
   *          User name in the queue (this may be 'New user' if the user
   *          initiating authorization for your app for the first time)
   */
  denyUser : function(provider_name, device_id, user_name) {

    var key = provider_name + "_" + device_id + "_" + user_name;
    var userObj = $fh.cache( {
    act : "load",
    key : key
    });

    var user = (userObj.val == "") ? undefined : $fh.parse(userObj.val);

    if (user == undefined) {
      user = {
        status : 'unknown'
      };
      return user;
    }

    user = "denied";

    $fh.log( {
      message : 'User denied on device: ' + device_id
    });

    $fh.cache( {
    act : "save",
    key : key,
    val : user
    });

    return user;

  },

  /**
   * Returns the user object. Is called when the app issues a request to check
   * user auth status.
   * 
   * @param provider_name
   *          The provider that authorizes the user
   * @param device_id
   *          UUID of the device that requestes auth
   * @param user_name
   *          User name in the queue (this may be 'New user' if the user who
   *          initiated authorization logs in for the first time from your app)
   * 
   * @return user Returns the user object. If user is authorized, it is removed
   *         form the queue.
   */

  queryUser : function(provider_name, device_id, user_name) {

    var key = provider_name + "_" + device_id + "_" + user_name;
    var userObj = $fh.cache( {
    act : "load",
    key : key
    });

    var user = (userObj.val == "") ? undefined : $fh.parse(userObj.val);

    if (user == undefined) {
      user = {
        status : 'unknown'
      };
      return user;
    }

    $fh.log( {
      message : 'Publishing user status to device: ' + user.device_id
    });

    if (user.status == "authorized") {

      $fh.cache( {
      act : "remove",
      key : key
      });

    }

    return user;
  }

  }

})();

