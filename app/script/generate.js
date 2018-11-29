var body = document.querySelector('body');
var input = document.querySelector('input');
var textarea = document.querySelector('textarea');
var audio = document.querySelector('audio');
var listSpeechDatas = document.querySelector('#listSpeechDatas');
var btnGenerate = document.querySelector('#btnGenerate');
var btnFinish = document.querySelector('#btnFinish');

var speechDatas;

function xhrGet(url, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      callback(request.responseText);
    }
  };
  request.open('GET', url);
  request.send();
}

function xhrPost(url, data, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      callback(request.responseText);
    }
  };
  request.open('POST', url);
  
  var formData = new FormData();
  formData.append('name', data.name);
  formData.append('words', data.words);
  request.send(formData);
}

function isIdExist(x) {
  for(i = 0; i < speechDatas.length; i++) {
    if (x === speechDatas[i].name) return true;
  }

  return false;
}

body.onload = async function () {
  xhrGet('/loadSpeechDatas', function (responseText) {
    speechDatas = JSON.parse(responseText).speechDatas;
    error = JSON.parse(responseText).error;

    console.info('speechDatas', speechDatas);

    if (typeof error !== 'undefined') {
      alert(error);
      open('/home.html', '_self');
    } else {
      for(i = 0; i < speechDatas.length; i++) {
        var option = document.createElement('option');
        option.value = speechDatas[i].name;

        listSpeechDatas.appendChild(option);
      }

      btnGenerate.disabled = false;
      btnFinish.disabled = false;
    }
  });
}

btnGenerate.onclick = function () {
  if (input.value.length === 0) {
    alert('Please select speech id');
  } else if (!isIdExist(input.value)){
    alert('Selected id doesn\'t exist');
  } else if (textarea.value.length === 0) {
    alert('Please input some word');
  } else {
    var data = {
      name: input.value,
      words: textarea.value
    };

    xhrPost('/generateSpeech', data, function (responseText) {
      var fileURL = JSON.parse(responseText).fileURL;
      var error = JSON.parse(responseText).error;
      
      if (typeof error !== 'undefined') {
        alert(error);
      } else {
        console.info('fileURL', fileURL);
        audio.src = fileURL;
        audio.play();
        audio.muted = false;
        audio.controls = true;
      }
    });
  }
};

btnFinish.onclick = function () {
  open('/home.html', '_self');
};

