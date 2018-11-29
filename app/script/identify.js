var audio = document.querySelector('audio');
var inSpeechId = document.querySelector('#inSpeechId');
var btnRecord = document.querySelector('#btnRecord');
var btnStop = document.querySelector('#btnStop');
var btnFinish = document.querySelector('#btnFinish');
var btnIdentify = document.querySelector('#btnIdentify');

var recorder;
var mediaStream = null;

function postFiles() {
  var blob = recorder.getBlob();
  var fileName = generateRandomString() + '.wav';
  var file = new File([blob], fileName, { type: 'audio/wav' });

  audio.src = '';

  xhr('/uploadFile', file, function (responseText) {
    var fileURL = JSON.parse(responseText).fileURL;

    console.info('fileURL', fileURL);
    audio.src = fileURL;
    audio.play();
    audio.muted = false;
    audio.controls = true;
  });

  if (mediaStream) mediaStream.stop();
}

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

btnIdentify.onclick = function () {
  if (inSpeechId.value.length === 0){
    alert('Please input speech id');
  } else if (audio.src === ''){
    alert('Please record some shown phonemes');
  } else {
    console.log('Nice')
  }
};

btnFinish.onclick = function () {
  open('/home.html', '_self');
};