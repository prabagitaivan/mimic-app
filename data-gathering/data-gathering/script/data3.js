var btnNext = document.querySelector('#btnNext');

function postFiles() {
  var blob = recorder.getBlob();
  var fileName = generateRandomString() + '.wav';
  var file = new File([blob], fileName, { type: 'audio/wav' });

  audio.src = '';

  xhr('/uploadData3', file, function (responseText) {
    var fileURL = JSON.parse(responseText).fileURL;

    console.info('fileURL', fileURL);
    audio.src = fileURL;
    audio.play();
    audio.muted = false;
    audio.controls = true;
  });

  if (mediaStream) mediaStream.stop();
}

btnNext.onclick = function () {
  open('/data-gathering/data4.html', '_self');
};