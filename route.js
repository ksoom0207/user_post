const express = require('express');
let router = express.Router({ mergeParams: true });

const post_controller = require('../routes');

router.get('/', post_controller.add_post);
//router.get('/', authUtil, post_controller.add_post);

router.post('/write', post_controller.write);

router.put('/:idx', (req, res) => { });

router.delete('/:idx', (req, res) => { });