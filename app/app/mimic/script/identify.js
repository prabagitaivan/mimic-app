const audio = document.querySelector('audio');
const input = document.querySelector('input');
const btnRecord = document.querySelector('#btnRecord');
const btnIdentify = document.querySelector('#btnIdentify');
const btnFinish = document.querySelector('#btnFinish');

let recorder;
let mediaStream = null;

function xhrPostUploadFile(file) {
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
  request.open('POST', '/uploadSpeech');

  const formData = new FormData();
  formData.append('file', file);
  request.send(formData);
}

function xhrPostIdentifySpeech(data) {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      const status = JSON.parse(request.responseText).status;
  
      console.info('status', status);
      alert(status);
    }
  };
  request.open('POST', '/identifySpeech');

  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('fileURL', data.fileURL);
  request.send(formData);
}

function postFiles() {
  const blob = recorder.getBlob();
  const fileName = generateRandomString() + '.wav';
  const file = new File([blob], fileName, { type: 'audio/wav' });

  audio.src = '';

  xhrPostUploadFile(file);

  if (mediaStream) mediaStream.stop();
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

btnIdentify.onclick = function () {
  if (input.value.length === 0){
    alert('Please input speech id');
  } else if (audio.src === ''){
    alert('Please record some shown phonemes');
  } else {
    const data = {
      name: input.value,
      fileURL: audio.src
    };
    console.log(data.fileURL);
    xhrPostIdentifySpeech(data);
  }
};

btnFinish.onclick = function () {
  open('/app/mimic/home.html', '_self');
};