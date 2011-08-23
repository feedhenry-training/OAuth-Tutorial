
  /*
   * Provider objects store the static values needed for oauth.
   * They implement simple functions that parse the requests/response containing
   * tokens or verifier codes. 
   * OAuth 1.0 provider must implement helper functions:
   * parseRequestToken(response) and parseAccessToken(response)
   * While OAuth 2.0 provider must implement parseToken(response)
   *
   * The OAuth 1.0 communication is handled by the server side, therefore 
   * OAuth 1.0 provider implements some specific functions that are used to 
   * prepare calls to the provider's API. Example: flickrProvidflickr_people_getPhotos(user, params)
   */

//---------------------------------------------------------//
//-----------------OAuth 1.0 Provider - Flickr-----------//
//---------------------------------------------------------//    

var flickrProvider = {

consumer_key : '12f4ad11ccbdad357c87d333a34ae667',
consumer_secret : '43ecf8020fcff350',
provider_name : 'flickr',
request_token_url : 'http://www.flickr.com/services/oauth/request_token',
access_token_url : 'http://www.flickr.com/services/oauth/access_token',
oauth_call : 'http://api.flickr.com/services/rest',
oauth_func : 'fr_authorization',
oauth_version : "1.0",

  
  /*
   * Helper function that parses the response containing request token and
   * returns an easly accessible data in a form of an object
   */
  
parseRequestToken : function(res) {

  // if we cannot read response
  if (res == null || res == undefined || res.body == undefined || res.errors) {
    return {
      "error" : {
      "type" : "RequestToken",
      "message" : "Internal web request error."
      }
    };
  }

  var body = res.body;

  // if token not in the body response
  if (body.indexOf('oauth_callback_confirmed=true') < 0) {
    return {
      "error" : {
      "type" : "RequestToken",
      "message" : "RequestToken response error"
      }
    };
  }
  // get Verifier succesfully!
  var oauth_token;
  var oauth_token_secret;

  var tmpArr = body.split('&');

  for ( var i = 0; i < tmpArr.length; i++) {

    if (tmpArr[i].indexOf('oauth_token_secret=') > -1) {
      var tokenArr = tmpArr[i].split('=');
      oauth_token_secret = tokenArr[1];
    }

    if (tmpArr[i].indexOf('oauth_token=') > -1) {
      var tokenArr = tmpArr[i].split('=');
      oauth_token = tokenArr[1];
    }
  }
  return {
    "token" : {
    "oauth_token_secret" : decodeURIComponent(oauth_token_secret),
    "oauth_token" : decodeURIComponent(oauth_token)
    }
  };

},
  /*
   * Helper function that parses the response containing access token and
   * returns an easly accessible data in a form of an object
   */
  

parseAccessToken : function(res) {

  // if we cannot read response
  if (res == null || res == undefined || res.body == undefined || res.errors) {
    return {
      "error" : {
      "type" : "AccessTokenError",
      "message" : "Internal web request error."
      }
    };
  }

  var body = res.body;

  // if token not in the body response
  if (body.indexOf('oauth_token_secret') < 0) {
    return {
      "error" : {
      "type" : "AccessTokenError",
      "message" : "AccessTokenError response error"
      }
    };
  }
  // get Access Token succesfully!
  var token = "";
  var token_secret = "";
  var username = "";
  var userid = "";

  var tmpArr = body.split('&');

  for ( var i = 0; i < tmpArr.length; i++) {

    if (tmpArr[i].indexOf('oauth_token_secret=') > -1) {
      var tokenArr = tmpArr[i].split('=');
      token_secret = tokenArr[1];
    }

    if (tmpArr[i].indexOf('oauth_token=') > -1) {
      var tokenArr = tmpArr[i].split('=');
      token = tokenArr[1];
    }

    if (tmpArr[i].indexOf('username') > -1) {
      var tokenArr = tmpArr[i].split('=');
      username = tokenArr[1];
    }

    if (tmpArr[i].indexOf('user_nsid') > -1) {
      var tokenArr = tmpArr[i].split('=');
      userid = tokenArr[1];
    }
  }
  return {
    "token" : {
    "oauth_token_secret" : decodeURIComponent(token_secret),
    "oauth_token" : decodeURIComponent(token),
    "username" : decodeURIComponent(username),
    "userid" : decodeURIComponent(userid)
    }
  };

},

  /*
   * Builds parameters object for a specific call to the provider's API
   * and uses OAuth1 Simple Client to execute the call
   */  
  
flickr_people_getPhotos : function(user, params) {

  var req_params = params || [];
  req_params.push( [ 'nojsoncallback', '1' ]);
  req_params.push( [ 'format', 'json' ]);
  req_params.push( [ 'oauth_consumer_key', this.consumer_key ]);
  req_params.push( [ 'oauth_token', user.access_token ]);
  req_params.push( [ 'oauth_version', '1.0' ]);
  req_params.push( [ 'method', 'flickr.people.getPhotos' ]);

  var reply = OAuth1Client
      .call(this, req_params, 'http://api.flickr.com/services/rest', user.access_token_secret);

  return $fh.parse(reply.body);

}

}

//---------------------------------------------------------//
//-----------------OAuth 2.0 Provider - Facebook-----------//
//---------------------------------------------------------//    
    
var facebookProvider = {

client_id : '201673399891834',
client_secret :'3875796a1e8c50ff51d3d457cec5e779',
provider_name : 'facebook',
redirect_url_func : 'f_authorization',
token_url : 'https://graph.facebook.com/oauth/access_token?client_id={client_id}&redirect_uri={redirect_uri}&client_secret={client_secret}&code={code}',
user_info_url : 'https://graph.facebook.com/me?access_token={access_token}',
code_name : 'code',

/*
 * Parses the response from the provider that should contain the token @param
 * req Http response to token request @return token Token object
 *
 */

parseToken : function(req) {

  // if we cannot read response
  if (req == null || req == undefined || req.body == undefined) {
    return {
      "error" : {
      "type" : "TokenError",
      "message" : "Facebook token response error"
      }
    };
  }

  // if response is an auth error
  if (req.error) {
    return req.error;
  }

  var body = req.body;

  // if token not in the body response
  if (body.indexOf('access_token') < 0) {
    return {
      "error" : {
      "type" : "TokenError",
      "message" : "Token response error"
      }
    };
  }
  // get access token succesfully!
  var token = "";
  var dateObj = undefined;

  var tmpArr = body.split('&');
  var expiry;

  for ( var i = 0; i < tmpArr.length; i++) {

    if (tmpArr[i].indexOf('access_token') > -1) {
      var tokenArr = tmpArr[i].split('=');
      token = tokenArr[1];
    }

    if (tmpArr[i].indexOf('expires') > -1) {
      var tokenArr = tmpArr[i].split('=');
      expiry = tokenArr[1];
    }
  }

  // prepare token expiry object
  var currentDate = new Date();
  currentDate.setSeconds(currentDate.getSeconds() + parseInt(expiry));
  var dateObj = {};
  if (expiry) {
    dateObj.date = currentDate.getDate();
    dateObj.month = currentDate.getMonth();
    dateObj.year = currentDate.getFullYear();
    dateObj.hour = currentDate.getHours();
    dateObj.minute = currentDate.getMinutes();
    dateObj.second = currentDate.getSeconds();
  }

  // token obtained successfully
  $fh.log( {
    message : 'Facebook token: ' + token + ', expiry: ' + expiry
  });

  return {
    "token" : {
    "access_token" : token,
    "access_expiry" : dateObj
    }
  };

}

}    