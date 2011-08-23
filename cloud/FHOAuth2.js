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

var OAuth2Client = {

  /*
   * The request is initiated by the provider and is a terget of redirect_url
   * param.
   * 
   * @param req Request body send by the provider - verification code or error.
   * @return HTML page The respone to this request should be a page, as this the
   * last stage of the browser login. Changes user status to denied or
   * authorized.
   * 
   */

  onAuthorization : function(req, provider) {

    // decode device_id and user_name stored in the redirect_url

    var idArr = $request.info().pathtranslated.split('/');

    var provider_name = provider.provider_name;
    var device_id = idArr[idArr.length - 2];
    var user_name = idArr[idArr.length - 1];
    var code = req[provider.code_name];


    // if JSON request body holds and error, does't contain the code
    // or it is impossible to decode device_id or user_name, set denied status
    if (req.error || !code || !device_id || !user_name) {

      OAuthUsers.denyUser(provider_name, device_id || "", user_name || "");

      $fh
          .log( {
            message : 'Provider code verification error: ' + req.error + ', reason: ' + req.error_reason + ', description: ' + req.error_description
          });
      $response.setContentType('text/html');
      $response
          .setContent('<h2>Authentication Failed. You may close the browser.</h2>');
      return {};
    }

    // prepare token access redirect_url, it must be exactly the same as
    // previous redirect_url
    var tokenRedirect = $fh.util( {
      'cloudUrl' : provider.redirect_url_func
    });
    var redirectUrl = tokenRedirect.cloudUrl;
    var urlQuery = '/{device_id}/{user_name}';
    urlQuery = urlQuery.replace('{user_name}', encodeURIComponent(user_name));
    urlQuery = urlQuery.replace('{device_id}', device_id);

    // prepare url token request
    var tokenUrl = provider.token_url;
    tokenUrl = tokenUrl.replace('{redirect_uri}', redirectUrl + urlQuery);
    tokenUrl = tokenUrl.replace('{code}', req[provider.code_name]);
    tokenUrl = tokenUrl.replace('{client_id}', provider.client_id);
    tokenUrl = tokenUrl.replace('{client_secret}', provider.client_secret);

    $fh
        .log( {
          message : 'Requesting token for device: ' + device_id + ', user: ' + user_name
        });

    // perform a call, token or error is returned in the reply (NOT
    // redirect_url!)
    var reply = $fh.web( {
    url : tokenUrl,
    method : "GET"
    });

    $fh.log( {
      message : 'Token response body: ' + reply.body

    });
    $fh.log( {
      message : 'Token response: ' + $fh.stringify(reply)

    });
    var res = provider.parseToken(reply);

    // if reply contains error, your app was denied the access
    if (res.error) {
      $fh
          .log( {
            message : 'Error obtaining the token: ' + res.error.type + ', message: ' + res.error.message
          });

      OAuthUsers.denyUser(provider_name, device_id, user_name);
      $response.setContentType('text/html');
      $response
          .setContent('<h2>Authorization Failed. You may close the browser.</h2>');
      return {};
    }

    // request user details
    var meUrl = provider.user_info_url;
    meUrl = meUrl.replace('{access_token}', escape(res.token.access_token));
    var meReply = $fh.web( {
    url : meUrl,
    method : "GET"
    });
    var me = $fh.parse(meReply.body);

    $fh.log( {
      message : 'User info response: ' + $fh.stringify(meReply)
    });

    // if query failed
    if (!meReply || meReply == null || meReply.error || !me || me.error) {
      OAuthUsers.denyUser(provider_name, device_id, user_name);
      $response.setContentType('text / html');
      $response
          .setContent('<h2> Login Failed.You may close the browser. </h2>');

      if (!me) {

        $fh.log( {
          message : 'Internal error while requesting user details: ' + $fh
              .stringify(meReply)
        });
      } else if (me.error) {

        $fh
            .log( {
              message : ' Facebook me request error: ' + (me.error.type || "") + ', message: ' + (me.error.message || "")
            });

      }

      return {};

    }
    // user details were received - change user_id and status to AUTHORIZE
    // add user_name_new - usrname assiged by the provider
    OAuthUsers
        .authorizeUserOAuth2(provider_name, device_id, res.token.access_token, res.token.access_expiry, user_name, me.name, me.id);
    $response.setContentType('text/html');
    $response
        .setContent('<h2>Thank you for authorizing our mobile application.</h2><p>Please close this window</p> ');
    return {};
  }
};
