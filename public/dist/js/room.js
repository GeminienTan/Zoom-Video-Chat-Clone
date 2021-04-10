'use strict';

// Polyfill in Firefox.
// See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
if (adapter.browserDetails.browser == 'firefox') {
  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}
var enabled = true;
const startButton = document.getElementById('shareButton');
const myScreen = document.createElement("video");
myScreen.addEventListener("resize", ev => {
  let w = myScreen.videoWidth;
  let h = myScreen.videoHeight;

  if (w && h) {
    myScreen.style.width = "400px";
    myScreen.style.height = "300px" ;
    myScreen.style.border = "thick solid #8C88FD";
    myScreen.style.backgroundColor = "#8C88FD";
  }
}, false);

startButton.addEventListener('click', () => {
  alert("ok");
  let myScreenStream;
  navigator.mediaDevices.getDisplayMedia({video: true})
  .then((stream) => {
    myScreenStream = stream;
    shareStop();
    addShareStream(myScreen, stream);
    peer.call(userId, myscreenStream);
    
    //call.peerConnection.getSenders()[1].replaceTrack(videoStreamTrack);
  });
});

const shareStop = () => {
  if (enabled == true) {
    setStopScreen();
    enabled = false;
  } else {
    setPlayScreen();
  }
};

const setStopScreen = () => {
  const html = `
  <i class="material-icons">stop_screen_share</i>
      <span>Stop Sharing</span>
    `;
  document.querySelector(".main__share_button").innerHTML = html;
};

const setPlayScreen = () => {
  const html = `
  <i class="fas fa-desktop"></i>
      <span>Share Screen</span>
    `;
  document.querySelector(".main__share_button").innerHTML = html;
};

const addShareStream = (video, stream) => {
  alert("add");
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const showRecord = () =>{
  $("#record").toggle();
  $("#chat").hide();
  $("#participant").hide();
}

const showParticipant = () =>{
  $("#record").hide();
  $("#chat").hide();
  $("#participant").toggle();
}
const showChat = () =>{
  $("#chat").toggle();
  $("#record").hide();
  $("#participant").hide();
}
const showWhiteBoard = () =>{
  $("#board").toggle();
  $("#screen").toggle();
}

const shareLink = (ROOM_ID) =>{
  var url = window.location.href;
  return url;
}
const leaveMeeting = (m_id,id,type) => {
    window.location.href = "/leaveMeeting/"+m_id+"&"+id+"&"+type;
}

window.addEventListener("beforeunload", function (e) {
  var confirmationMessage = "\o/";

  (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                              //Webkit, Safari, Chrome
  return confirmationMessage;
  //window.location.href = "/leaveMeeting/"+m_id+"&"+id+"&"+type;
});





