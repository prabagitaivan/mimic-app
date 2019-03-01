/**
 * `load` used to load developing configuration database.
 * 
 * It is not officialy part of mimic_speech research app because
 * it is just complementary file so that another developer could use
 * my database configuration when I develop the application and research.
 * 
 * Remeber that `location` value is the repository location and make sure MongoDB server is on
 * also make sure that you rename `data.develop` to `data`. 
 */

const connection = require('../db/connection');
const model = require('../db/model');

async function load() {
  try {
    let location = process.cwd();

    model.models.db = await connection.connect();
    await model.speechDatas.create({
      "name": "ivan",
      "syllables": {
        "a": location + "\\data\\speech\\upload_27357fb3b2e7a366ab149489356d1da7.wav",
        "i": location + "\\data\\speech\\upload_621926a8369f8137660c4a7fdf299f34.wav",
        "na": location + "\\data\\speech\\upload_9ce99d35b37b0c17eb662ad4d7b8b45e.wav",
        "di": location + "\\data\\speech\\upload_9069f082202eb5111ab3344521cd44a7.wav",
        "ku": location + "\\data\\speech\\upload_40e5547f8f3979bdd67b4e5a8742f571.wav",
        "ri": location + "\\data\\speech\\upload_280aa93374677d4f26c812f33b0ff7bb.wav",
        "kan": location + "\\data\\speech\\upload_606dfa7868d1f4c4e1c72af7f18a5b68.wav",
        "mu": location + "\\data\\speech\\upload_4af2738efed549e61ed9575feeaa2508.wav",
        "ma": location + "\\data\\speech\\upload_206cbc82b965ed22236fa798b47c671d.wav"
      }
    });

    location = 'file:///' + location.replace(/\\/g, '/').split(':/')[1];
    await model.models.insertMany([
      { "location": location + "/data/train/model/99db9b2c748d3b460f923f15a3fce30d", "createAt": 1547558953617 },
      { "location": location + "/data/train/model/304fa46f1a6b92e7d9ba1a96211649ed", "createAt": 1547559033712 },
      { "location": location + "/data/train/model/bfaa3257fc85f1f406950baa25352c71", "createAt": 1547559117423 },
      { "location": location + "/data/train/model/7825bf964462a7f18d1c309f102388ea", "createAt": 1547559209125 },
      { "location": location + "/data/train/model/8017dcc343915bd287b8f70641938ee9", "createAt": 1547559290417 },
      { "location": location + "/data/train/model/055573633c8d49bc2c76eb4d0cd37802", "createAt": 1547559398569 },
      { "location": location + "/data/train/model/bd455661733c3d506047e7745358ab38", "createAt": 1547559497703 },
      { "location": location + "/data/train/model/04d299b47a93408e4cc0ccbf3e425b87", "createAt": 1547559586345 },
      { "location": location + "/data/train/model/96146c3454c9015c3c010a0e1ebf9b46", "createAt": 1547559672937 },
      { "location": location + "/data/train/model/970c186b54752c5eec96ae2dba4b503e", "createAt": 1547559751883 },
      { "location": location + "/data/train/model/cde1d94e2f09644dfac3df106ae73efe", "createAt": 1547559835378 },
      { "location": location + "/data/train/model/711244044045e71cec840ab536f54816", "createAt": 1547559928065 },
      { "location": location + "/data/train/model/e42e29843a1ad3512b0b61c7a2c5fa54", "createAt": 1547560018651 },
      { "location": location + "/data/train/model/0d43d6c3cdbad6a69001456a36c93ff1", "createAt": 1547560095557 },
      { "location": location + "/data/train/model/8c8ef0dcbe355e049c9b68fad4aa9944", "createAt": 1547560184057 },
      { "location": location + "/data/train/model/eeb534882431fd41d25ddb90277a84f7", "createAt": 1547560267313 },
      { "location": location + "/data/train/model/30c99b22ecc41d0ce96d016659f206ce", "createAt": 1547560342068 },
      { "location": location + "/data/train/model/5021f9dd23825a7e79edcc5cebf38c94", "createAt": 1547560415092 },
      { "location": location + "/data/train/model/c2621fdad1723bd584d4c0530c140ad6", "createAt": 1547560487035 },
      { "location": location + "/data/train/model/9255739ac6580c7f66fb6cbfe6fa155d", "createAt": 1547560561061 },
      { "location": location + "/data/train/model/9b0ba0ad21697bf53ca5d914b8332433", "createAt": 1547560633691 },
      { "location": location + "/data/train/model/f8346e5b58e6d4c9bf53009040a0afb5", "createAt": 1547560706997 },
      { "location": location + "/data/train/model/f061b8c33043c3775bf24c40aca1d59d", "createAt": 1547560783478 },
      { "location": location + "/data/train/model/cd8fa7d5b327a5d2659fbb30a86b93ea", "createAt": 1547560881700 },
      { "location": location + "/data/train/model/b0d26fea90b1a011fed8863ab05a577a", "createAt": 1547560961167 }
    ]);

    console.log("load success!");
  } catch (err) {
    console.log('Error:', err);
  } finally {
    await connection.disconnect();
  }
}

load();