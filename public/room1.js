/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

var share = false;

// Polyfill in Firefox.
// See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
if (adapter.browserDetails.browser == 'firefox') {
  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

function handleSuccess(stream) {
  startButton.disabled = true;
  setStopSharing();
  const video = document.querySelector('video');
  video.srcObject = stream;

  // demonstrates how to detect that the user has stopped
  // sharing the screen via the browser UI.
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    errorMsg('The user has ended sharing the screen');
    startButton.disabled = false;
    setSharing();
  });
}

function handleError(error) {
  errorMsg(`getDisplayMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}
/*
function stopStreamedVideo() {
  alert("yes")
  const video = document.querySelector('video');
  alert("ha")
  video.srcObject = stream;
  const tracks = stream.getTracks();
  
  tracks.forEach(function(track) {
    track.stop();
  });

  video.srcObject = null;
}
*/
const shareButton = document.getElementById('shareButton');

shareButton.addEventListener('click', () => {
    if(share==false){
        alert(share)
        navigator.mediaDevices.getDisplayMedia({video: true})
      .then(handleSuccess, handleError);
      share = true;
    }
    else{
      alert("click")
        /*const video = document.querySelector('video');
        // A video's MediaStream object is available through its srcObject attribute
        const mediaStream = video.srcObject;
        // Through the MediaStream, you can get the MediaStreamTracks with getTracks():
        const tracks = mediaStream.getTracks();
        // Tracks are returned as an array, so if you know you only have one, you can stop it with: 
        tracks[0].stop();
        // Or stop all like so:
        tracks.forEach(track => track.stop())
        setSharing();
        share= false;*/
    }
});

//const participantButton = document.getElementById('participantButton');

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
  startButton.disabled = false;
} else {
  errorMsg('getDisplayMedia is not supported');
  
}

const setStopSharing = () => {
    const html = `
        <i class="stop fas fa-stop-circle"></i>
        <span>Stop Sharing</span>
      `;
    document.querySelector(".main__share_button").innerHTML = html;
};

const setSharing = () => {
    const html = `
        <i class="fas fa-desktop"></i>
        <span>Share Screen</span>
      `;
    document.querySelector(".main__share_button").innerHTML = html;
};