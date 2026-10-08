const express = require('express');
const router = express.Router();
const { list, getOne, create, update, remove } = require('../controllers/sections.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('tables:view'), list);
router.post('/', authorize('tables:manage'), create);
router.get('/:id', authorize('tables:view'), getOne);
router.patch('/:id', authorize('tables:manage'), update);
router.delete('/:id', authorize('tables:manage'), remove);

module.exports = router;
