const formidable = require('formidable');
const util = require('util');

async function router(address, port, filename, request) {
  let response;

  if (request.method === 'POST') {
    if (filename.toString().indexOf('\\uploadSpeech') != -1) response = await uploadSpeech(address, port, request);
  }

  return response;
}

function uploadSpeech(address, port, request) {
  const dirData = '\\data\\';
  const dirSpeech = '\\speech\\';

  const form = new formidable.IncomingForm();
  form.uploadDir = process.cwd() + dirData + dirSpeech;
  form.keepExtensions = true;
  form.maxFieldsSize = 10 * 1024 * 1024;
  form.maxFields = 1000;
  form.multiples = false;

  return new Promise(function (resolve) {
    form.parse(request, function (err, fields, files) {
      const file = util.inspect(files);

      const fileName = file.split('path:')[1].split('\',')[0].split(dirData)[1].split(dirSpeech)[1].toString().replace(/\\/g, '').replace(/\//g, '');
      const fileURL = 'http://' + address + ':' + port + '/data/speech/' + fileName;

      console.log('fileURL: ', fileURL);
      resolve(JSON.stringify({ fileURL: fileURL }));
    });
  });
}

module.exports = router;