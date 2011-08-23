/**
 */

$fh.ready(function() {

      // reset saved users
      // LocalStorage.remove( {key : 'oauth_users'});
      userManager.initUsers();

      // create new facebook user using the template settings and allow oauth
      // module to manage users
      var facebookUser = new FHOAuth2User( {}, providers['facebook']);
      var f_saved_users = userManager.getUsersByProvider('facebook');
      var f_current_user = userManager.getCurrentUserByProvider('facebook');

      var flickrUser = new FHOAuth1User( {}, providers['flickr']);
      var fr_saved_users = userManager.getUsersByProvider('flickr');
      var fr_current_user = userManager.getCurrentUserByProvider('flickr');

      if (!f_saved_users || !f_saved_users.length) {
        userManager.addUser(facebookUser);
      }
      if (!fr_saved_users || !fr_saved_users.length) {
        userManager.addUser(flickrUser);
      }
      userManager.changeCurrentUser('facebook', facebookUser.user_name);
      userManager.changeCurrentUser('flickr', flickrUser.user_name);

      // bind 'pageshow' event to facebook and flickr page
      $("div:jqmData(url*='facebook.html'), div:jqmData(url*='flickr.html')")
          .live('pageshow', function(event, ui) {
            viewController
                .currentUserToString($(this).find("p.current-user"), 'facebook');
          });

      // bind 'pageshow' event to facebook-users page
      $("div:jqmData(url*='facebook-users.html')")
          .live('pageshow', function(event, ui) {
            // prepare list of users
            viewController.listUsers($(this).find("ul.users-list"), 'facebook');
          });

      // bind 'pageshow' event to flickr-users page
      $("div:jqmData(url*='flickr-users.html')")
          .live('pageshow', function(event, ui) {
            // prepare list of users
            viewController.listUsers($(this).find("ul.users-list"), 'flickr');
          });

      // bind login button event
      $("button.browserLogin").live("click", function() {
        var provider_name = $(this).data("provider_name");
        var user_name = $(this).data("user_name");
        var user = userManager.getUser(provider_name, user_name);
        user.browserLogin(function() {
          $.mobile.changePage(provider_name + ".html", "slide");
        }, function() {
          alert('Login failed.');
        });

      });

      // bind switch user event
      $("button.switchCurrentUser").live("click", function() {
        var provider_name = $(this).data("provider_name");
        var user_name = $(this).data("user_name");
        userManager.changeCurrentUser(provider_name, user_name);
        viewController
            .listUsers($('div.ui-page').find("ul.users-list"), provider_name);
      });

      // bind 'pageshow' event for facebook-myfriends page
      $("div:jqmData(url*='facebook-myfriends.html')")
          .live('pageshow', function(event, ui) {
            // get the list of friends
            viewController
                .listFriends($(this).find("ul.friends-list"), 'facebook');
          });

      // bind 'pageshow' event for flickr-photos page
      $("div:jqmData(url*='flickr-photos.html')")
          .live('pageshow', function(event, ui) {
            // get the list of friends
            viewController
                .listFrPhotos($(this).find("ul.photos-list"), 'flickr');
          });

    });
