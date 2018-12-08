const btnRecord = document.querySelector('#btnRecord');
const audio = document.querySelector('audio');

let recorder;
let mediaStream = null;

function xhrPostUploadCollect(url, file) {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      const fileURL = JSON.parse(request.responseText).fileURL;

      console.info('fileURL', fileURL);
      audio.src = fileURL;
      audio.play();
      audio.muted = false;
      audio.controls = true;
    }
  };
  request.open('POST', url);

  const formData = new FormData();
  formData.append('file', file);
  request.send(formData);
}

function generateRandomString() {
  if (window.crypto) {
    const a = window.crypto.getRandomValues(new Uint32Array(3));
    let token = '';

    for (i = 0, l = a.length; i < l; i++) {
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

    recorder = RecordRTC(mediaStream, {
      mimeType: 'audio/wav',
      recorderType: StereoAudioRecorder,
      numberOfAudioChannels: 1,
      desiredSampRate: 16000,
      onAudioProcessStarted: function () {
        btnRecord.innerHTML = 'Say Now';

        setTimeout(function () {
          btnRecord.disabled = false;
          btnRecord.innerHTML = 'Record Again';

          recorder.stopRecording(postFiles);
        }, 1000);
      }
    });

    recorder.startRecording();
  });
};