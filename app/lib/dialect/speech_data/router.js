const express = require('express');
const controller = require('./controller');

const router = express.Router();

router.get('/', controller.read);
router.post('/', controller.update);

module.exports = router;
