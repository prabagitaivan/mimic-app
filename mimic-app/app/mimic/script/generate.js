const body = document.querySelector('body');
const input = document.querySelector('input');
const textarea = document.querySelector('textarea');
const audio = document.querySelector('audio');
const listSpeechData = document.querySelector('#listSpeechData');
const btnGenerate = document.querySelector('#btnGenerate');
const btnFinish = document.querySelector('#btnFinish');

let speechData;

/**
 * `xhrGetSpeechData` load all speech data from the server.
 * 
 * Send GET `loadSpeech` request.
 * Accept `speechData` from response to be used as `listSpeechData` datalist.
 * It also give alert message whenever the response contain `error` message.
 */
function xhrGetSpeechData() {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      speechData = JSON.parse(request.responseText).speechData;
      const error = JSON.parse(request.responseText).error;

      console.info('speechData', speechData);

      if (typeof error !== 'undefined') {
        alert(error);
        open('/app/mimic/home.html', '_self');
      } else {
        for (i = 0; i < speechData.length; i++) {
          const option = document.createElement('option');
          option.value = speechData[i];

          listSpeechData.appendChild(option);
        }

        btnGenerate.disabled = false;
        btnFinish.disabled = false;
      }
    }
  };
  request.open('GET', '/loadSpeech');
  request.send();
}

/**
 * `xhrPostGenerateSpeech` send `words` based on `name` to server, convert it to wav file and
 * receive uri the file.
 * 
 * Send POST `generateSpeech` request with one of `speechData` list as `name` and
 * text that want to be generated from textarea as `words` on it.
 * Accept `fileURL` from response and use it as `audio` source.
 * It also give alert message whenever the response contain `error` message.
 */
function xhrPostGenerateSpeech(data) {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      const fileURL = JSON.parse(request.responseText).fileURL;
      const error = JSON.parse(request.responseText).error;

      if (typeof error !== 'undefined') {
        alert(error);
      } else {
        console.info('fileURL', fileURL);
        audio.src = fileURL;
        audio.play();
        audio.muted = false;
        audio.controls = true;
      }

      btnGenerate.disabled = false;
    }
  };
  request.open('POST', '/generateSpeech');

  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('words', data.words);
  request.send(formData);
}

/**
 * Check inputed value on datalist contain speech data on `speechData` that get from the server.
 */
function isIdExist(x) {
  for (i = 0; i < speechData.length; i++) {
    if (x === speechData[i]) return true;
  }

  return false;
}

body.onload = xhrGetSpeechData();

/**
 * Validate inputed values is exist and empty or not.
 * Existed and not empty values will pass the value to `xhrPostGenerateSpeech`
 */
btnGenerate.onclick = function () {
  if (input.value.length === 0) {
    alert('Please select speech id');
  } else if (!isIdExist(input.value)) {
    alert('Selected id doesn\'t exist');
  } else if (textarea.value.length === 0) {
    alert('Please input some word');
  } else {
    const data = {
      name: input.value,
      words: textarea.value
    };

    btnGenerate.disabled = true;

    xhrPostGenerateSpeech(data);
  }
};

btnFinish.onclick = function () {
  open('/app/mimic/home.html', '_self');
};

