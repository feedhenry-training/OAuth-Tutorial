
var LocalStorage = (function() {

  return {

  save : function(params, callback, errback) {
    $fh.data( {
    act : 'save',
    key : params.key,
    val : JSON.stringify(params.val)
    }, callback, errback);
  },

  load : function(params, callback, errback) {

    $fh.data( {
    act : 'load',
    key : params.key
    }, callback, errback);

  },

  remove : function(params, callback, errback) {

    $fh.data( {
    act : 'remove',
    key : params.key
    }, callback, errback);
  }

  }

})();

