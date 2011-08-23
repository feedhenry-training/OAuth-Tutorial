/*
 * Facbook calls this action when forwards access_token
 *
 */
/*
 * Facebook calls this action when forwards all the data
 *
 */

function f_authorization(req) {

  OAuth2Client.onAuthorization(req, facebookProvider);

}

/*
 * Returns to the device public URL of 'f_authorization' server side function
 * 
 */
function f_authorization_url() {

  var res = $fh.util( {
    'cloudUrl' : 'f_authorization'
  });
  return res;

}

/*
 * Flickr calls this action when forwards all the data
 * 
 */

function fr_authorization(req) {

  // OAuth1Client.getAccessToken($request.info().querystring,
  // $request.info().pathtranslated, flickrProvider);
  OAuth1Client.getAccessToken(req, flickrProvider);

}

/*
 * You app calls this method to obtain Flickr request_token
 * 
 */
function fr_request_token(req) {

  return OAuth1Client.getRequestToken(req, flickrProvider);

}

/*
 * You app calls this method to obtain user photos from Flickr
 * 
 */

function fr_flickr_people_getPhotos(req) {

  return flickrProvider.flickr_people_getPhotos(req.user, req.params);

}

/*
 * Adds the user object to subscribers list of 'waiting for authorization'.
 * 
 * @param req JSON FHOAuth2User object @return user JSON FHOAuth2User object
 * 
 */
function oauth_subscribe(req) {

  $fh.log(' Subscribing user: ' + req.user.user_name);

  return OAuthUsers.addUser(req.user);
}

/*
 * Returns the user object current status in the list
 * 
 * @param req JSON FHOAuth2User object @return user JSON FHOAuth2User object
 * 
 */

function oauth_status(req) {

  $fh.log(' Querying user status for device: ' + req.user.device_id);

  return OAuthUsers
      .queryUser(req.user.provider.provider_name, req.user.device_id, req.user.user_name);

}
