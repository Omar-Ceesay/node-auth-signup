const CLIENT_ID = "542826481216-0irbth3isb8mdunc7u1gp332se6mo2oe.apps.googleusercontent.com";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');

const defaultChannel = "youtube";

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: 'auto',
        width: '100%',
        videoId: 'vWJmsgmJem4',
        playerVars: {
            playsinline: 1,
            autoplay: 1
        },
        events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.pauseVideo();
}

  // 5. The API calls this function when the player's state changes.
  //    The function indicates that when playing a video (state=1),
  //    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        // setTimeout(stopVideo, 6000);
        // done = true;
    }
    $(".html5-main-video").attr("playsinline", true).attr("webkit-playsinline", true);
}
function stopVideo() {
    player.stopVideo();
}

function handleClientLoad(){
    gapi.load('client:auth2', initclient)
}

function initclient(){
    gapi.client.setApiKey("AIzaSyA5eJyvT9XVeCL6Arksk-92Cq3zPyj8O_Q");
    gapi.client.init({
        discoverDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(() => {
        gapi.client.load('youtube', 'v3', () => {
            // Listen for signin state changes
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle initial signin state
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
        });
    })
}
function updateSigninStatus(isSignedIn){
    if(isSignedIn){
        authorizeButton.style.display = "none";
        signoutButton.style.display = "block";
        content.style.display = "block";
        videoContainer.style.display = "block";
        defineRequest();
    }else{
        authorizeButton.style.display = "block";
        signoutButton.style.display = "none";
        content.style.display = "none";
        videoContainer.style.display = "none";
    }
}

function handleAuthClick(){
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(){
    gapi.auth2.getAuthInstance().signOut();
}

//GET channel from api
function getChannel(channel){    
    gapi.client.youtube.channels
    .list({
        part: 'snippet,contentDetails',
        forUsername: channel
    })
    .then(res => {
        //console.log(res);
        
    })
    .catch(err => alert("No channel found"))
}

function removeEmptyParams(params) {
    for (var p in params) {
      if (!params[p] || params[p] == 'undefined') {
        delete params[p];
      }
    }
    return params;
}

function executeRequest(request) {
    request.execute(function(response) {
        var videoids = [];

        response.items.forEach(e => {
            videoids.push(e.snippet.resourceId.videoId)
        });
        player.loadPlaylist(videoids);
        $(".html5-main-video").attr("playsinline", "true").attr("webkit-playsinline", "true");
        //$('#video-container').append($('<iframe>').attr("src", `https://www.youtube.com/embed/${response.items[0].snippet.resourceId.videoId}`).attr("width", "560").attr("height", "315"));
    });
}

$("#shuffle").click(function(){
    player.setShuffle(true);
});

function buildApiRequest(requestMethod, path, params, properties) {
    params = removeEmptyParams(params);
    var request;
    if (properties) {
      var resource = createResource(properties);
      request = gapi.client.request({
          'body': resource,
          'method': requestMethod,
          'path': path,
          'params': params
      });
    } else {
      request = gapi.client.request({
          'method': requestMethod,
          'path': path,
          'params': params
      });
    }
    executeRequest(request);
  }

function defineRequest() {
    // See full sample for buildApiRequest() code, which is not 
// specific to a particular API or API method.

    buildApiRequest('GET',
                '/youtube/v3/playlistItems',
                {'maxResults': '35',
                    'part': 'snippet',
                    'playlistId': 'FLBrhqqFSYdLrDjUr-TOT63Q'});
    
}
// var lastSeen
// var loop = function(){
//     $('.html5-video-container').contents().unwrap().wrap('<audio/>');
//     console.log("HIT")
// }
// setInterval(function(){
//     loop();
// }, 5000)

$("#hush-button").click(function(){
    var timeout = $("#hush-input").val();
    document.getElementById("timer").innerHTML = timeout + " secs";
    var count = timeout;
    var counter=setInterval(timer, 1000);

    function timer()
        {
        count=count-1;
        if (count <= -1)
        {
            clearInterval(counter);
            player.stopVideo();
            return;
        }
        document.getElementById("timer").innerHTML=count + " secs"; // watch for spelling
        //Do code for showing the number of seconds here
    }
});
