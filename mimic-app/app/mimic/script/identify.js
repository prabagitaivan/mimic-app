const audio = document.querySelector('audio');
const input = document.querySelector('input');
const btnRecord = document.querySelector('#btnRecord');
const btnIdentify = document.querySelector('#btnIdentify');
const btnFinish = document.querySelector('#btnFinish');

let recorder;
let mediaStream = null;
let filePath = '';

/**
 * `xhrPostUploadFile` send `file` to the server, upload it and receive uri and path of the file.
 * 
 * Send POST `uploadSpeech` request with wav `file` on it.
 * Accept `fileURL` from response and use it as `audio` source.
 * It also accept `filePath` from response and use it later as input for `xhrPostIdentifySpeech`.
 */
function xhrPostUploadFile(file) {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      const fileURL = JSON.parse(request.responseText).fileURL;
      filePath = JSON.parse(request.responseText).filePath;

      console.info('fileURL', fileURL);
      console.info('filePath', filePath);

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

/**
 * `xhrPostIdentifySpeech` send `words` based on `name` to server, convert it to wav file and uri.
 * 
 * Send POST `identifySpeech` request with input text as `name` and `filePath` on it.
 * Accept `status` from response and alert it.
 */
function xhrPostIdentifySpeech(data) {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      const status = JSON.parse(request.responseText).status;

      console.info('status', status);
      alert(status);

      btnRecord.disabled = false;
      btnIdentify.disabled = false;
    }
  };
  request.open('POST', '/identifySpeech');

  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('filePath', data.filePath);
  request.send(formData);
}

/**
 * `postFiles` create wav file from `RecordRTC` and
 * then use it to send `xhrPostUploadFile` request.
 */
function postFiles() {
  const blob = recorder.getBlob();
  const fileName = generateRandomString() + '.wav';
  const file = new File([blob], fileName, { type: 'audio/wav' });

  audio.src = '';

  xhrPostUploadFile(file);

  if (mediaStream) mediaStream.stop();
}

/**
 * `generateRandomString` generate random 32 long crypto string.
 */
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

/**
 * `captureUserMedia` ask permission access to use microphone.
 * When the permission is granted it return a callback. 
 */
function captureUserMedia(successCallback) {
  navigator.getUserMedia({ audio: true }, successCallback, function (error) {
    alert('Unable to capture your microphone. Please check console logs.');
    console.error(error);
  });
}

/**
 * Start record after microphone access is granted.
 * It record on 16000 sample rate, mono, and stop automatically after 1 second.
 */
btnRecord.onclick = function () {
  captureUserMedia(function (stream) {
    btnRecord.disabled = true;
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

/**
 * Validate inputed values is exist and empty or not.
 * Existed and not empty values will pass the value to `xhrPostIdentifySpeech`
 */
btnIdentify.onclick = function () {
  if (input.value.length === 0) {
    alert('Please input speech id');
  } else if (filePath.length === 0) {
    alert('Please record some shown phonemes');
  } else {
    const data = {
      name: input.value,
      filePath: filePath
    };

    btnRecord.disabled = true;
    btnIdentify.disabled = true;

    xhrPostIdentifySpeech(data);
  }
};

btnFinish.onclick = function () {
  open('/app/mimic/home.html', '_self');
};