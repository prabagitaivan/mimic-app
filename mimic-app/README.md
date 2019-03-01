# Mimic-Speech

Apps to mimic speech in bahasa indonesia.

### Software Used for Apps Development 

  - OS (Windows 10 64-bit)
  - Browser (Chrome v70.0.3538.110 (Official Build) (64-bit))
  - Node.js (x10.14.1)
  - MongoDB (v4.0.2)
  - Git (2.18.0.windows.1)

### How To Run

Make sure that _Node.js_, _MongoDB_ is already installed and run
commands below through command prompt in **_mimic-app_** repository.

To install all module and create directory that will be used. **If you want to use my speech data and db config use command below**.
```sh
$ npm run setup
```

To install all module and load my speech data and db config when develop the apps. **The data only provided in the CD (not available with git clone)**. **If you want to fresh start use command above**.
```sh
$ npm run load
```

To start the server for collect app and mimic app.
```sh
$ npm run start
```

To train the collected data from collect app.
```sh
$ npm run train
```

### Code Reference

  - https://github.com/muaz-khan/RecordRTC/tree/master/RecordRTC-to-Nodejs
  - https://github.com/tensorflow/tensorflow/tree/master/tensorflow/examples/speech_commands
  - https://github.com/tensorflow/tfjs-models/tree/master/speech-commands
  - https://github.com/jameslyons/python_speech_features/tree/master/python_speech_features
  - https://github.com/vail-systems/node-mfcc/blob/master/src/mfcc.js
  - https://github.com/meyda/meyda/blob/master/src/extractors/mfcc.js

### Author
**Valens Prabagita Ivan Susilo**
_001201500075_
prabagita12@gmail.com