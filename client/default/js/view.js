var viewController = (function() {

  // public functions
  return {

  currentUserToString : function($p_element, provider_name) {

    var currentuser = userManager.getCurrentUserByProvider(provider_name);
    $p_element
        .append('Current user: ' + currentuser.user_name + ' (' + (currentuser
            .isValidAccessToken() ? '' : 'Not ') + 'Authorized)');

  },

  listUsers : function($ul_element, provider_name) {

    var users = userManager.getUsersByProvider(provider_name);
    var currentuser = userManager.getCurrentUserByProvider(provider_name);
    $ul_element.children().remove();
    // display a list of users
    for ( var u = 0; u < users.length; u++) {
      var $li_element = $('<li data-user_name="' + users[u].user_name + '" data-provider_name="' + users[u].provider.provider_name + '">' + users[u].user_name + '</li>');

      if (users[u].user_name == currentuser.user_name) {
        $li_element.append('<p class="ui-li-desc">Current user</p>');
      }
      // if curent user, display login button if not authorized
      if (users[u].user_name == currentuser.user_name && !users[u]
          .isValidAccessToken()) {
        $li_element
            .append('<button data-user_name="' + users[u].user_name + '" data-provider_name="' + users[u].provider.provider_name + '" class="browserLogin">Login</button>');
      }
      // if not current user, display switch button
      else if (users[u].user_name != currentuser.user_name) {
        $li_element
            .append('<button data-user_name="' + users[u].user_name + '" data-provider_name="' + users[u].provider.provider_name + '" class="switchCurrentUser">Switch User</button>');
      }
      $ul_element.append($li_element);

    }
    $ul_element.listview('refresh');

  },

  listFriends : function($ul_element, provider_name) {

    var errback = function() {
      alert('Error reciving data')
    };
    var currentUser = userManager.getCurrentUserByProvider(provider_name);
    var params = {
      user_id : currentUser.user_id
    };
    userManager.callOAuth2(currentUser, params, 'friends', function(res) {
      if (res.body) {
        var data = JSON.parse(res.body);
        $ul_element.children().remove();
        // display a list of users
        for ( var d = 0; d < data.data.length; d++) {
          var $li_element = $('<li>' + data.data[d].name + '</li>');
          $ul_element.append($li_element);
        }
        $ul_element.listview('refresh');
      }
    }, errback);

  },

  listFrPhotos : function($ul_element, provider_name) {

    var errback = function() {
      alert('Error reciving data')
    };
    var currentUser = userManager.getCurrentUserByProvider(provider_name);

    // we are hardcoding FEEDHENRY user_id photos here
    var params = [ [ 'user_id', '63862562@N03' ] ];

    //please refer to Flickr documentation to find out more on the request and respone
    //http://www.flickr.com/services/api/flickr.people.getPhotos.html
    //also you can find here detailed info how to build image url:
    //http://www.flickr.com/services/api/misc.urls.html
    userManager
        .callOAuth1(currentUser, params, 'photos', function(res) {
          if (res.photos) {
            $ul_element.children().remove();
            // display a list of photos
            for ( var p = 0; p < res.photos.photo.length; p++) {
              var photo = res.photos.photo[p];
              var $li_element = $('<li><a href="#">' + '<img src="http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/'+ photo.id + '_' + photo.secret + '_s.jpg" class="ui-li-thumb">' + '<h3 class="ui-li-heading">Photo</h3>' + '<p class="ui-li-desc">FeedHenry Photo</p>' + '</a></li>');

              $ul_element.append($li_element);
            }
          }
          // no photos
          else {
            var $li_element = $('<li>No photos</li>');
            $ul_element.append($li_element);
          }
          $ul_element.listview('refresh');
        }, errback);

  }

  }

})();
