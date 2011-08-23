

var providers = {


    facebook: {

        provider_name: 'facebook',
        oauth_version: '2',
        client_id: '201673399891834',
        paths: {
            user: "https://graph.facebook.com/{id}?access_token={access_token}",
            me: "https://graph.facebook.com/me?access_token={access_token}",
            friends: "https://graph.facebook.com/{user_id}/friends?access_token={access_token}",
            permissions: "https://graph.facebook.com/{user_id}/permissions?access_token={access_token}",
            newsfeed: "https://graph.facebook.com/me/home?access_token={access_token}",
            wallfeed: "https://graph.facebook.com/me/feed?access_token={access_token}",
            login: "https://www.facebook.com/dialog/oauth?client_id={client_id}&scope={scope}&response_type=code&display=wap&redirect_uri={redirect_uri}"
        },
        scope: 'read_friendlists,read_stream,publish_stream,offline_access',
        redirect_uri: 'f_authorization_url'

    },
    flickr: {

     
        provider_name: 'flickr',
        oauth_version: '1',      
        paths: {
           login: "http://www.flickr.com/services/oauth/authorize?oauth_token=",
           photos: "fr_flickr_people_getPhotos"
        },
        scope: 'write,read',
        request_token_url: 'fr_request_token'
       

    }  

}
    

    
    

