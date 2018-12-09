const body = document.querySelector('body');
const input = document.querySelector('input');
const textarea = document.querySelector('textarea');
const audio = document.querySelector('audio');
const listSpeechData = document.querySelector('#listSpeechData');
const btnGenerate = document.querySelector('#btnGenerate');
const btnFinish = document.querySelector('#btnFinish');

let speechData;

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

function isIdExist(x) {
  for (i = 0; i < speechData.length; i++) {
    if (x === speechData[i]) return true;
  }

  return false;
}

body.onload = xhrGetSpeechData();

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

