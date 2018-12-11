const btnNext = document.querySelector('#btnNext');

/**
 * `postFiles` create wav file from `RecordRTC` and
 * then use it to send `xhrPostUploadCollect` request.
 */
function postFiles() {
  const blob = recorder.getBlob();
  const fileName = generateRandomString() + '.wav';
  const file = new File([blob], fileName, { type: 'audio/wav' });

  audio.src = '';

  xhrPostUploadCollect('/uploadCollectRi', file);

  if (mediaStream) mediaStream.stop();
}

btnNext.onclick = function () {
  open('/app/collect/ku.html', '_self');
};