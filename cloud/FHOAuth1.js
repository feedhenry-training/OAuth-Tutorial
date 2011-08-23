
  /*
   * Simple implementation of the OAuth 1.0 authorization requests.
   * OAuth1Client.call() - prepares the signed request based on the arguments and queries the provider
   * OAuth1Client.getRequestToken() - initiates the oauth authorization by requesting the initial request token
   * OAuth1Client.getAccessToken() - this is the providers callback target, it receives the verifier code and exchanges it for the access token
   */

var OAuth1Client = (function() {

  return {

  /*
   * Builds the OAuth 1.0 request and performs a call
   */

  call : function(provider, params, url, tokenSecret) {

    // cunsumer credential used to sign the request
    var credentials = {
    consumerSecret : provider.consumer_secret,
    tokenSecret : tokenSecret || ''
    };

    // aditional request details used to buld based url that is used
    // together with
    var message = {
    action : url,
    method : 'GET',
    parameters : params
    };

    // add timestamp and nonce to request details
    OAuth.setTimestampAndNonce(message);

    // IMPORTANT!!! - fix timestamp
    for ( var p = 0; p < params.length; p++) {

      if (params[p][0] == 'oauth_timestamp') {

        var unix = Math.round((new Date()).getTime() / 1000).toString();
        params[p][1] = unix;
      }
    }

    // sign request
    OAuth.SignatureMethod.sign(message, credentials);

    var bs = OAuth.SignatureMethod.getBaseString(message);

    $fh.log( {
      message : 'Debbuging base string: ' + bs
    });

    // reformat parameters object to use it with $fh.web
    var webParams = [];

    for ( var p = 0; p < params.length; p++) {
      var key = params[p][0];
      var value = params[p][1];
      webParams.push( {
      name : key,
      value : value
      });
    }

    // perform a call to get request token
    var reply = $fh.web( {
    url : url,
    method : "GET",
    params : webParams
    });

    return reply;

  },

  /*
   * Function is fired before the user is redirected to the browser to log in with the provider
   * It obtains the request token that must be included in the user login link.
   * Function is triggered from the device.
   */

  getRequestToken : function(req, provider) {

    // add user
    var user = req.user;
    OAuthUsers.addUser(user);

    // specify redirect url - used to redirect token after user signs in
    var action = $fh.util( {
      'cloudUrl' : provider.oauth_func
    });

    // add user details to the redirect_uri
    var redirect_uri = action.cloudUrl + '?device_id=' + user.device_id + '&user_name=' + user.user_name;

    // specify parameters for the request (timestamp and nonce are aded later)
    var params = [ [ 'oauth_consumer_key', provider.consumer_key ], [ 'oauth_version', '1.0' ], [ 'oauth_callback', redirect_uri ] ];

    var reply = OAuth1Client.call(provider, params, provider.request_token_url);

    $fh.log( {
      message : 'Request token reply: ' + $fh.stringify(reply)
    });

    //parse the request token into an object
    var requestToken = provider.parseRequestToken(reply);

    //update user details
    user.request_token_secret = requestToken.token.oauth_token_secret;
    user.request_token = requestToken.token.oauth_token;
    OAuthUsers.addUser(user);
    return requestToken;

  },

  /*
   * Function is called by the provider itself. The cloud url that leads here 
   * has been passed in as a callback url by the OAuth1Client.getRequestToken().
   * The data that comes with this request should contain the verifier code.
   * The verifier must be exchanged for the access token. Depending on the
   * success of failure of this process, the page with the communication
   * result is displayed to th user. The page is displayed in the browser,
   * as this is the last step of the browser login.
   */
    
  getAccessToken : function(req, provider) {

    var device_id = req.device_id;
    var user_name = req.user_name;
    var verifier = req.oauth_verifier;
    var request_token = req.oauth_token;

    var user = OAuthUsers
        .queryUser(provider.provider_name, device_id, user_name);

    //if the request does not hold the verifier parameter, display error page and return
    if (!verifier) {

      OAuthUsers
          .denyUser(provider.provider_name, device_id || "", user_name || "");

      $fh.log( {
        message : 'Provider request verification error: ' + $fh
            .stringify(res.verifier)
      });
      $response.setContentType('text/html');
      $response
          .setContent('<h2>Authentication Failed. You may close the browser.</h2>');
      return {};

    }

    // specify parameters for the accet token request (timestamp and nonce are added later)
    var params = [ [ 'oauth_consumer_key', provider.consumer_key ], [ 'oauth_version', '1.0' ], [ 'oauth_verifier', verifier ], [ 'oauth_token', request_token ]

    ];

    //call provider's API to receive the access token
    var tokenReply = OAuth1Client
        .call(provider, params, provider.access_token_url, user.request_token_secret);

    $fh.log( {
      message : 'Provider access token response: ' + $fh.stringify(tokenReply)
    });

    //parse access token response
    var token = provider.parseAccessToken(tokenReply);

    //if the request does not hold the access token, display error page and return    
    if (!token || token.error) {

      OAuthUsers
          .denyUser(provider.provider_name, device_id || "", user_name || "");

      $fh.log( {
        message : 'Provider access token error'
      });
      $response.setContentType('text/html');
      $response
          .setContent('<h2>Authentication Failed. You may close the browser.</h2>');
      return {};

    }
    
    //if access token received, display success page and update user details
    OAuthUsers
        .authorizeUserOAuth1(provider.provider_name, device_id, token.token.oauth_token, token.token.oauth_token_secret, user_name, token.token.username, token.token.userid);
    $response.setContentType('text/html');
    $response
        .setContent('<h2>Thank you for authorizing our mobile application.</h2><p>Please close this window</p> ');
    return {};

  }

  }

})();
