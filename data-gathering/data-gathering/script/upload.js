var btnRecord = document.querySelector('#btnRecord');
var btnStop = document.querySelector('#btnStop');
var audio = document.querySelector('audio');

var recorder;
var mediaStream = null;

function xhr(url, data, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      callback(request.responseText);
    }
  };
  request.open('POST', url);

  var formData = new FormData();
  formData.append('file', data);
  request.send(formData);
}

function generateRandomString() {
  if (window.crypto) {
    var a = window.crypto.getRandomValues(new Uint32Array(3));
    var token = '';

    for (var i = 0, l = a.length; i < l; i++) {
      token += a[i].toString(36);
    }

    return token;
  } else {
    return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
  }
}


function captureUserMedia(successCallback) {
  navigator.getUserMedia({ audio: true }, successCallback, function (error) {
    alert('Unable to capture your microphone. Please check console logs.');
    console.error(error);
  });
}

btnRecord.onclick = function () {
  btnRecord.disabled = true;

  captureUserMedia(function (stream) {
    mediaStream = stream;

    audio.src = window.URL.createObjectURL(stream);
    audio.play();
    audio.muted = true;
    audio.controls = false;

    recorder = RecordRTC(mediaStream, {
      mimeType: 'audio/wav',
      recorderType: StereoAudioRecorder,
      numberOfAudioChannels: 1,
    });

    recorder.startRecording();

    btnStop.disabled = false;
  });
};


btnStop.onclick = function () {
  btnRecord.disabled = false;
  btnStop.disabled = true;

  recorder.stopRecording(postFiles);
};