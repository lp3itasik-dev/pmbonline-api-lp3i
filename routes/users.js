const express = require('express');
const router = express.Router();
const { User } = require('../models');
const verifytoken = require('../middlewares/verifytoken');
const verifyapikey = require('../middlewares/verifyapikey');

/* GET users listing. */
router.get('/', verifytoken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const response = await User.findAll({
      attributes: ['name','email','phone','role','status'],
      limit: limit,
      offset: offset,
    });

    const totalItems = await User.count();
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      totalPages: totalPages,
      totalItems: totalItems,
      currentPage: page,
      data: response.length > 0 ? response : [],
      limit,
    });
  } catch (error) {
    return res.json({
      message: error.message
    });
  }
});

/* GET user listing. */
router.get('/:identity', async (req, res) => {
  try {
    const response = await User.findOne({
      where: {
        identity: req.params.identity
      }
    });

    if (!response) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    return res.status(200).json({
      message: 'User found',
    });
  } catch (error) {
    return res.json({
      message: error.message
    });
  }
});

module.exports = router;