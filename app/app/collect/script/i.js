const btnNext = document.querySelector('#btnNext');

function postFiles() {
  const blob = recorder.getBlob();
  const fileName = generateRandomString() + '.wav';
  const file = new File([blob], fileName, { type: 'audio/wav' });

  audio.src = '';

  xhrPostUploadCollect('/uploadCollectI', file);

  if (mediaStream) mediaStream.stop();
}

btnNext.onclick = function () {
  open('/app/collect/t.html', '_self');
};