const formidable = require('formidable');
const util = require('util');

/**
 * `uploadCollect` upload file in the `request` based on defined directory and
 * then convert its path location to url.
 * 
 * Return the url as `fileURL`.
 */
function uploadCollect(address, port, label, request) {
  const dirData = '\\data';
  const dirCollect = '\\collect';
  const dirLabel = '\\' + label + '\\';

  const form = new formidable.IncomingForm();
  form.uploadDir = process.cwd() + dirData + dirCollect + dirLabel;
  form.keepExtensions = true;
  form.maxFieldsSize = 10 * 1024 * 1024;
  form.maxFields = 1000;
  form.multiples = false;

  return new Promise(function (resolve) {
    form.parse(request, function (err, fields, files) {
      const file = util.inspect(files);

      const fileName = file.split('path:')[1].split('\',')[0].split(dirData)[1].split(dirCollect)[1].split(dirLabel)[1].toString().replace(/\\/g, '').replace(/\//g, '');
      const fileURL = 'http://' + address + ':' + port + '/data/collect/' + label + '/' + fileName;

      console.log('fileURL: ', fileURL);
      resolve(JSON.stringify({ fileURL: fileURL }));
      return;
    });
  });
}

/**
 * `router` handle all collect app request, each response corresponding to each request.
 * There are a lot of request categorized by collect app but all of them is basically `uploadCollect`. 
 * When the request doesn't match anything it return nothing.
 */
async function router(address, port, filename, request) {
  let response;

  if (request.method === 'POST') {
    if (filename.toString().indexOf('\\uploadCollectA') != -1) response = await uploadCollect(address, port, 'a', request);
    else if (filename.toString().indexOf('\\uploadCollectI') != -1) response = await uploadCollect(address, port, 'i', request);
    else if (filename.toString().indexOf('\\uploadCollectNa') != -1) response = await uploadCollect(address, port, 'na', request);
    else if (filename.toString().indexOf('\\uploadCollectMa') != -1) response = await uploadCollect(address, port, 'ma', request);
    else if (filename.toString().indexOf('\\uploadCollectMu') != -1) response = await uploadCollect(address, port, 'mu', request);
    else if (filename.toString().indexOf('\\uploadCollectDi') != -1) response = await uploadCollect(address, port, 'di', request);
    else if (filename.toString().indexOf('\\uploadCollectRi') != -1) response = await uploadCollect(address, port, 'ri', request);
    else if (filename.toString().indexOf('\\uploadCollectKu') != -1) response = await uploadCollect(address, port, 'ku', request);
    else if (filename.toString().indexOf('\\uploadCollectKan') != -1) response = await uploadCollect(address, port, 'kan', request);
    else if (filename.toString().indexOf('\\uploadCollectUnknown') != -1) response = await uploadCollect(address, port, 'unknown', request);
  }

  return response;
}

// export `router` functions.
module.exports = router;