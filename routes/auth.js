require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const verifytoken = require('../middlewares/verifytoken');
const verifyapikey = require('../middlewares/verifyapikey');

const { JWT_SECRET, JWT_SECRET_REFRESH_TOKEN, JWT_ACCESS_TOKEN_EXPIRED, JWT_REFRESH_TOKEN_EXPIRED } = process.env;

const { User, Applicant, ApplicantFamily, School } = require('../models');
const { body, validationResult } = require('express-validator');

function getYearPMB() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const startYear = currentMonth >= 9 ? currentYear + 1 : currentYear;
  return startYear;
}

function capitalizeFirstLetter(str) {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function capitalizeName(name) {
  return name
    .split(' ')
    .map(part => capitalizeFirstLetter(part))
    .join(' ');
}

router.get('/', (req, res) => {
  try {
    return res.send('Authentication PMB Online 🇮🇩');
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* Forgot Password | Use for PPO */
router.post('/forgot/v1', verifyapikey, async (req, res) => {
  try {
    if(!req.body.phone){
      return res.status(422).json({ message: 'Phone is required.' });
    }
    const account = await User.findOne({
      where: {
        phone: req.body.phone
      }
    });
    if(!account){
      return res.status(404).json({ message: 'Account not found.' });
    }
    const hashPassword = await bcrypt.hash(req.body.phone, 10);
    await User.update({
      password: hashPassword
    },{
      where: {
        phone: req.body.phone
      }
    });
    const updatedAccount = await User.findOne({
      where: {
        phone: req.body.phone
      }
    });
    return res.status(200).json({
      name: updatedAccount.name,
      email: updatedAccount.email,
      phone: updatedAccount.phone,
      message: 'Password reset successful!'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* Use for PPO */
router.post('/login/v1', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please check the email address and try again.' });
    }

    const hashPass = /^\$2y\$/.test(user.password) ? '$2b$' + user.password.slice(4) : user.password;

    const match = await bcrypt.compare(req.body.password, hashPass);

    if (!match) {
      return res.status(401).json({ message: 'Invalid password. Please check the password and try again.' });
    }

    const payload = {
      id: user.id,
      identity: user.identity,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    }

    const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
    const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

    await User.update({
      token: refreshTokenPMBOnline,
    }, {
      where: {
        id: user.id
      }
    });

    res.cookie('refreshTokenPMBOnlineV1', refreshTokenPMBOnline, {
      httpOnly: true,
      secure: false,
    });

    return res.status(200).json({
      token: token,
      refresh_token: refreshTokenPMBOnline,
      message: 'Login successful!'
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* Use for TGB, Psikotest */
router.post('/login/v2', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please check the email address and try again.' });
    }

    const hashPass = /^\$2y\$/.test(user.password) ? '$2b$' + user.password.slice(4) : user.password;

    const match = await bcrypt.compare(req.body.password, hashPass);

    if (!match) {
      return res.status(401).json({ message: 'Invalid password. Please check the password and try again.' });
    }

    const payload = {
      id: user.id,
      identity: user.identity,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    }

    const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
    const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

    await User.update({
      token: refreshTokenPMBOnline,
    }, {
      where: {
        id: user.id
      }
    });

    res.cookie('refreshTokenPMBOnlineV2', refreshTokenPMBOnline, {
      httpOnly: true,
      secure: true,
    });

    return res.status(200).json({
      token: token,
      refresh_token: refreshTokenPMBOnline,
      message: 'Login successful!'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* Use for SBPMB */
router.post('/login/v3', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please check the email address and try again.' });
    }

    const hashPass = /^\$2y\$/.test(user.password) ? '$2b$' + user.password.slice(4) : user.password;

    const match = await bcrypt.compare(req.body.password, hashPass);

    if (!match) {
      return res.status(401).json({ message: 'Invalid password. Please check the password and try again.' });
    }

    const payload = {
      id: user.id,
      identity: user.identity,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    }

    const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
    const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

    await User.update({
      token: refreshTokenPMBOnline,
    }, {
      where: {
        id: user.id
      }
    });

    res.cookie('refreshTokenPMBOnlineV3', refreshTokenPMBOnline, {
      httpOnly: true,
      secure: false,
    });

    return res.status(200).json({
      token: token,
      refresh_token: refreshTokenPMBOnline,
      message: 'Login successful!'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* Use for PPO */
router.post('/register/v1', [
  body('name')
    .isLength({ max: 150 }).withMessage('name cannot be more than 150 characters long')
    .notEmpty().withMessage('name is required')
  ,
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .isLength({ max: 100 }).withMessage('email cannot be more than 100 characters long')
    .notEmpty().withMessage('email is required')
    .custom(async (value) => {
      const user = await User.findOne({
        where: {
          email: value
        }
      });
      if (user) {
        return Promise.reject('Email already in use');
      }
    }),
  body('phone')
    .notEmpty().withMessage('phone is required')
    .isLength({ min: 12 }).withMessage('phone cannot be at least 12 characters long')
    .isLength({ max: 15 }).withMessage('phone cannot be more than 15 characters long')
    .isMobilePhone('id-ID').withMessage('Phone number must be a valid Indonesian phone number')
    .custom(async (value) => {
      const user = await User.findOne({
        where: {
          phone: value
        }
      });
      if (user) {
        return Promise.reject('Phone already in use');
      }
    }),
  body('school')
    .notEmpty().withMessage('school is required'),
  body('information')
    .notEmpty().withMessage('information is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, phone, school, information } = req.body;

    const schoolCheck = await School.findOne({
      where: { id: school }
    });

    const schoolNameCheck = await School.findOne({
      where: { name: school }
    });

    var schoolVal;

    if (schoolCheck) {
      schoolVal = schoolCheck.id;
    } else {
      if (schoolNameCheck) {
        schoolVal = schoolNameCheck.id;
      } else {
        const dataSchool = {
          name: school.toUpperCase(),
          region: 'TIDAK DIKETAHUI'
        }

        const schoolCreate = await School.create(dataSchool);
        schoolVal = schoolCreate.id;
      }
    }

    const applicant = await Applicant.findOne({
      where: {
        phone: phone
      }
    });

    if (applicant) {
      const dataApplicant = {
        email: email,
        programtypeId: 3,
        sourceDaftarId: 12,
        statusId: 1,
        followupId: 1,
      }

      const hashPassword = await bcrypt.hash(phone, 10);

      const dataUser = {
        identity: applicant.identity,
        name: applicant.name,
        email: email,
        phone: applicant.phone,
        password: hashPassword,
        role: 'S',
        status: true
      }

      const userCreated = await User.create(dataUser);
      await Applicant.update(dataApplicant, {
        where: {
          id: applicant.id
        }
      });

      const payload = {
        id: userCreated.id,
        name: userCreated.name,
        email: userCreated.email,
        phone: userCreated.phone,
        role: userCreated.role,
        status: userCreated.status
      }

      const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

      await User.update({
        token: refreshTokenPMBOnline,
      }, {
        where: {
          id: userCreated.id
        }
      });

      res.cookie('refreshTokenPMBOnlineV1', refreshTokenPMBOnline, {
        httpOnly: true,
        secure: false,
      });

      return res.status(200).json({
        token: token,
        refresh_token: refreshTokenPMBOnline,
        message: 'Registration successful!'
      });
    } else {
      const identityUser = uuidv4();
      const presenter = await User.findOne({
        where: {
          role: 'P',
          identity: information
        }
      });

      const dataApplicant = {
        identity: identityUser,
        name: capitalizeName(name),
        school: schoolVal,
        email: email,
        phone: phone,
        pmb: getYearPMB(),
        identityUser: presenter ? information : '6281313608558',
        programtypeId: 3,
        sourceId: 12,
        sourceDaftarId: 12,
        statusId: 1,
        followupId: 1,
      }

      const hashPassword = await bcrypt.hash(phone, 10);

      const dataUser = {
        identity: identityUser,
        name: capitalizeName(name),
        email: email,
        phone: phone,
        password: hashPassword,
        role: 'S',
        status: true
      }

      const dataFather = {
        identityUser: identityUser,
        gender: true
      }

      const dataMother = {
        identityUser: identityUser,
        gender: false
      }

      const userCreated = await User.create(dataUser);
      await Applicant.create(dataApplicant);
      await ApplicantFamily.create(dataFather);
      await ApplicantFamily.create(dataMother);

      const payload = {
        id: userCreated.id,
        identity: userCreated.identity,
        name: userCreated.name,
        email: userCreated.email,
        phone: userCreated.phone,
        role: userCreated.role,
        status: userCreated.status
      }

      const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

      await User.update({
        token: refreshTokenPMBOnline,
      }, {
        where: {
          id: userCreated.id
        }
      });

      res.cookie('refreshTokenPMBOnlineV1', refreshTokenPMBOnline, {
        httpOnly: true,
        secure: false,
      });

      return res.status(200).json({
        token: token,
        refresh_token: refreshTokenPMBOnline,
        message: 'Registration successful!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* use for TGB, Psikotest */
router.post('/register/v2', [
  body('name')
    .isLength({ max: 150 }).withMessage('name cannot be more than 150 characters long')
    .notEmpty().withMessage('name is required')
  ,
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .isLength({ max: 100 }).withMessage('email cannot be more than 100 characters long')
    .notEmpty().withMessage('email is required')
    .custom(async (value) => {
      const user = await User.findOne({
        where: {
          email: value
        }
      });
      if (user) {
        return Promise.reject('Email already in use');
      }
    }),
  body('phone')
    .notEmpty().withMessage('phone is required')
    .isLength({ min: 12 }).withMessage('phone cannot be at least 12 characters long')
    .isLength({ max: 15 }).withMessage('phone cannot be more than 15 characters long')
    .isMobilePhone('id-ID').withMessage('Phone number must be a valid Indonesian phone number')
    .custom(async (value) => {
      const user = await User.findOne({
        where: {
          phone: value
        }
      });
      if (user) {
        return Promise.reject('Phone already in use');
      }
    }),
  body('information')
    .notEmpty().withMessage('information is required'),
  body('school')
    .notEmpty().withMessage('school is required'),
  body('classes')
    .notEmpty().withMessage('class is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, phone, school, classes, information } = req.body;

    const schoolCheck = await School.findOne({
      where: { id: school }
    });

    const schoolNameCheck = await School.findOne({
      where: { name: school }
    });

    var schoolVal;

    if (schoolCheck) {
      schoolVal = schoolCheck.id;
    } else {
      if (schoolNameCheck) {
        schoolVal = schoolNameCheck.id;
      } else {
        const dataSchool = {
          name: school.toUpperCase(),
          region: 'TIDAK DIKETAHUI'
        }

        const schoolCreate = await School.create(dataSchool);
        schoolVal = schoolCreate.id;
      }
    }

    const applicant = await Applicant.findOne({
      where: {
        phone: phone
      }
    });

    if (applicant) {
      const dataApplicant = {
        school: schoolVal,
        class: classes,
        email: email,
        programtypeId: 3,
        sourceDaftarId: 11,
        statusId: 1,
        followupId: 1,
      }

      const hashPassword = await bcrypt.hash(phone, 10);

      const dataUser = {
        identity: applicant.identity,
        name: applicant.name,
        email: email,
        phone: applicant.phone,
        password: hashPassword,
        role: 'S',
        status: true
      }

      const userCreated = await User.create(dataUser);
      await Applicant.update(dataApplicant, {
        where: {
          id: applicant.id
        }
      });

      const payload = {
        id: userCreated.id,
        identity: userCreated.identity,
        name: userCreated.name,
        email: userCreated.email,
        phone: userCreated.phone,
        role: userCreated.role,
        status: userCreated.status
      }

      const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

      await User.update({
        token: refreshTokenPMBOnline,
      }, {
        where: {
          id: userCreated.id
        }
      });

      res.cookie('refreshTokenPMBOnlineV2', refreshTokenPMBOnline, {
        httpOnly: true,
        secure: false,
      });

      return res.status(200).json({
        token: token,
        refresh_token: refreshTokenPMBOnline,
        message: 'Registration successful!'
      });
    } else {
      const identityUser = uuidv4();
      const presenter = await User.findOne({
        where: {
          role: 'P',
          identity: information
        }
      });

      const dataApplicant = {
        identity: identityUser,
        name: capitalizeName(name),
        email: email,
        school: schoolVal,
        class: classes,
        phone: phone,
        pmb: getYearPMB() + 2,
        identityUser: presenter ? information : '6281313608558',
        programtypeId: 3,
        sourceId: 11,
        sourceDaftarId: 11,
        statusId: 1,
        followupId: 1,
      }

      const hashPassword = await bcrypt.hash(phone, 10);

      const dataUser = {
        identity: identityUser,
        name: capitalizeName(name),
        email: email,
        phone: phone,
        password: hashPassword,
        role: 'S',
        status: true
      }

      const dataFather = {
        identityUser: identityUser,
        gender: true
      }

      const dataMother = {
        identityUser: identityUser,
        gender: false
      }

      const userCreated = await User.create(dataUser);
      await Applicant.create(dataApplicant);
      await ApplicantFamily.create(dataFather);
      await ApplicantFamily.create(dataMother);

      const payload = {
        id: userCreated.id,
        identity: userCreated.identity,
        name: userCreated.name,
        email: userCreated.email,
        phone: userCreated.phone,
        role: userCreated.role,
        status: userCreated.status
      }

      const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

      await User.update({
        token: refreshTokenPMBOnline,
      }, {
        where: {
          id: userCreated.id
        }
      });

      res.cookie('refreshTokenPMBOnlineV2', refreshTokenPMBOnline, {
        httpOnly: true,
        secure: false,
      });

      return res.status(200).json({
        token: token,
        refresh_token: refreshTokenPMBOnline,
        message: 'Registration successful!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* use for SBPMB */
router.post('/register/v3', [
  body('name')
    .isLength({ max: 150 }).withMessage('name cannot be more than 150 characters long')
    .notEmpty().withMessage('name is required')
  ,
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .isLength({ max: 100 }).withMessage('email cannot be more than 100 characters long')
    .notEmpty().withMessage('email is required')
    .custom(async (value) => {
      const user = await User.findOne({
        where: {
          email: value
        }
      });
      if (user) {
        return Promise.reject('Email already in use');
      }
    }),
  body('phone')
    .notEmpty().withMessage('phone is required')
    .isLength({ min: 12 }).withMessage('phone cannot be at least 12 characters long')
    .isLength({ max: 15 }).withMessage('phone cannot be more than 15 characters long')
    .isMobilePhone('id-ID').withMessage('Phone number must be a valid Indonesian phone number')
    .custom(async (value) => {
      const user = await User.findOne({
        where: {
          phone: value
        }
      });
      if (user) {
        return Promise.reject('Phone already in use');
      }
    }),
  body('school')
    .notEmpty().withMessage('school is required'),
  body('year')
    .notEmpty().withMessage('year is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, phone, school, year } = req.body;

    const schoolCheck = await School.findOne({
      where: { id: school }
    });

    const schoolNameCheck = await School.findOne({
      where: { name: school }
    });

    var schoolVal;

    if (schoolCheck) {
      schoolVal = schoolCheck.id;
    } else {
      if (schoolNameCheck) {
        schoolVal = schoolNameCheck.id;
      } else {
        const dataSchool = {
          name: school.toUpperCase(),
          region: 'TIDAK DIKETAHUI'
        }

        const schoolCreate = await School.create(dataSchool);
        schoolVal = schoolCreate.id;
      }
    }

    const applicant = await Applicant.findOne({
      where: {
        phone: phone
      }
    });

    if (applicant) {
      const dataApplicant = {
        school: schoolVal,
        year: year,
        email: email,
        programtypeId: 3,
        sourceDaftarId: 10,
        statusId: 1,
        followupId: 1,
      }

      const hashPassword = await bcrypt.hash(phone, 10);

      const dataUser = {
        identity: applicant.identity,
        name: applicant.name,
        email: email,
        phone: applicant.phone,
        password: hashPassword,
        role: 'S',
        status: true
      }

      const userCreated = await User.create(dataUser);
      await Applicant.update(dataApplicant, {
        where: {
          id: applicant.id
        }
      });

      const payload = {
        id: userCreated.id,
        identity: userCreated.identity,
        name: userCreated.name,
        email: userCreated.email,
        phone: userCreated.phone,
        role: userCreated.role,
        status: userCreated.status
      }

      const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

      await User.update({
        token: refreshTokenPMBOnline,
      }, {
        where: {
          id: userCreated.id
        }
      });

      res.cookie('refreshTokenPMBOnlineV3', refreshTokenPMBOnline, {
        httpOnly: true,
        secure: false,
      });

      return res.status(200).json({
        token: token,
        refresh_token: refreshTokenPMBOnline,
        message: 'Registration successful!'
      });
    } else {
      const identityUser = uuidv4();
      const dataApplicant = {
        identity: identityUser,
        name: capitalizeName(name),
        email: email,
        school: schoolVal,
        year: year,
        phone: phone,
        pmb: getYearPMB(),
        identityUser: '6281313608558',
        programtypeId: 3,
        sourceId: 10,
        sourceDaftarId: 10,
        statusId: 1,
        followupId: 1,
      }

      const hashPassword = await bcrypt.hash(phone, 10);

      const dataUser = {
        identity: identityUser,
        name: capitalizeName(name),
        email: email,
        phone: phone,
        password: hashPassword,
        role: 'S',
        status: true
      }

      const dataFather = {
        identityUser: identityUser,
        gender: true
      }

      const dataMother = {
        identityUser: identityUser,
        gender: false
      }

      const userCreated = await User.create(dataUser);
      await Applicant.create(dataApplicant);
      await ApplicantFamily.create(dataFather);
      await ApplicantFamily.create(dataMother);

      const payload = {
        id: userCreated.id,
        identity: userCreated.identity,
        name: userCreated.name,
        email: userCreated.email,
        phone: userCreated.phone,
        role: userCreated.role,
        status: userCreated.status
      }

      const token = jwt.sign({ data: payload }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      const refreshTokenPMBOnline = jwt.sign({ data: payload }, JWT_SECRET_REFRESH_TOKEN, { expiresIn: JWT_REFRESH_TOKEN_EXPIRED });

      await User.update({
        token: refreshTokenPMBOnline,
      }, {
        where: {
          id: userCreated.id
        }
      });

      res.cookie('refreshTokenPMBOnlineV3', refreshTokenPMBOnline, {
        httpOnly: true,
        secure: false,
      });

      return res.status(200).json({
        token: token,
        refresh_token: refreshTokenPMBOnline,
        message: 'Registration successful!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/website/v1', [
  body('name')
    .isLength({ max: 150 }).withMessage('name cannot be more than 150 characters long')
    .notEmpty().withMessage('name is required')
  ,
  body('phone')
    .notEmpty().withMessage('phone is required')
    .isLength({ min: 12 }).withMessage('phone cannot be at least 12 characters long')
    .isLength({ max: 15 }).withMessage('phone cannot be more than 15 characters long')
    .isMobilePhone('id-ID').withMessage('Phone number must be a valid Indonesian phone number')
    .custom(async (value) => {
      const user = await User.findOne({
        where: {
          phone: value
        }
      });
      if (user) {
        return Promise.reject('Phone already in use');
      }
    }),
  body('school')
    .notEmpty().withMessage('school is required'),
  body('year')
    .notEmpty().withMessage('year is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, phone, school, year } = req.body;

    const schoolCheck = await School.findOne({
      where: { id: school }
    });

    const schoolNameCheck = await School.findOne({
      where: { name: school }
    });

    var schoolVal;

    if (schoolCheck) {
      schoolVal = schoolCheck.id;
    } else {
      if (schoolNameCheck) {
        schoolVal = schoolNameCheck.id;
      } else {
        const dataSchool = {
          name: school.toUpperCase(),
          region: 'TIDAK DIKETAHUI'
        }

        const schoolCreate = await School.create(dataSchool);
        schoolVal = schoolCreate.id;
      }
    }

    const applicant = await Applicant.findOne({
      where: {
        phone: phone
      }
    });

    if (applicant) {
      const dataApplicant = {
        year: year,
        programtypeId: 3,
        sourceDaftarId: 1,
        statusId: 1,
        followupId: 1,
      }

      await Applicant.update(dataApplicant, {
        where: {
          id: applicant.id
        }
      });

      return res.status(200).json({
        found: true,
        message: 'Thank you for filling in the data!'
      });
    } else {
      const identityUser = uuidv4();
      const dataApplicant = {
        identity: identityUser,
        name: capitalizeName(name),
        school: schoolVal,
        phone: phone,
        pmb: getYearPMB(),
        identityUser: '6281313608558',
        year: year,
        programtypeId: 3,
        sourceId: 1,
        sourceDaftarId: 1,
        statusId: 1,
        followupId: 1,
      }

      const dataFather = {
        identityUser: identityUser,
        gender: true
      }

      const dataMother = {
        identityUser: identityUser,
        gender: false
      }

      await Applicant.create(dataApplicant);
      await ApplicantFamily.create(dataFather);
      await ApplicantFamily.create(dataMother);

      return res.status(200).json({
        found: false,
        message: 'Thank you for filling in the data!'
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/token/v1', async (req, res) => {
  try {
    const refreshTokenPMBOnline = req.cookies.refreshTokenPMBOnlineV1;
    if (!refreshTokenPMBOnline) {
      return res.status(400).json({
        status: 'error',
        message: 'invalid token'
      });
    }

    const refresh = await User.findOne({
      where: {
        token: refreshTokenPMBOnline
      }
    });

    if (!refresh) {
      return res.status(400).json({ message: 'Refresh token not found.' });
    }

    jwt.verify(refreshTokenPMBOnline, JWT_SECRET_REFRESH_TOKEN, (error, decoded) => {
      if (error) {
        return res.status(403).json({ message: error.message });
      }
      const token = jwt.sign({ data: decoded.data }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      return res.status(200).json(token);
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/token/v2', async (req, res) => {
  try {
    const refreshTokenPMBOnline = req.cookies.refreshTokenPMBOnlineV2;
    if (!refreshTokenPMBOnline) {
      return res.status(400).json({
        status: 'error',
        message: 'invalid token'
      });
    }

    const refresh = await User.findOne({
      where: {
        token: refreshTokenPMBOnline
      }
    });

    if (!refresh) {
      return res.status(400).json({ message: 'Refresh token not found.' });
    }

    jwt.verify(refreshTokenPMBOnline, JWT_SECRET_REFRESH_TOKEN, (error, decoded) => {
      if (error) {
        return res.status(403).json({ message: error.message });
      }
      const token = jwt.sign({ data: decoded.data }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      return res.status(200).json(token);
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/token/v3', async (req, res) => {
  try {
    const refreshTokenPMBOnline = req.cookies.refreshTokenPMBOnlineV3;
    if (!refreshTokenPMBOnline) {
      return res.status(400).json({
        status: 'error',
        message: 'invalid token'
      });
    }

    const refresh = await User.findOne({
      where: {
        token: refreshTokenPMBOnline
      }
    });

    if (!refresh) {
      return res.status(400).json({ message: 'Refresh token not found.' });
    }

    jwt.verify(refreshTokenPMBOnline, JWT_SECRET_REFRESH_TOKEN, (error, decoded) => {
      if (error) {
        return res.status(403).json({ message: error.message });
      }
      const token = jwt.sign({ data: decoded.data }, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRED });
      return res.status(200).json(token);
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/validation', async (req, res) => {
  try {
    const { field, value } = req.body;
    const applicant = await Applicant.findOne({
      where: {
        [field]: value
      }
    });
    if (applicant) {
      const user = await User.findOne({
        where: {
          [field]: value
        }
      });
      if (user) {
        return res.status(200).json({
          message: 'Account found in users and applicant.',
          data: {
            name: applicant.name,
            email: applicant.email,
            phone: applicant.phone,
          },
          create: false,
        });
      } else {
        return res.status(404).json({
          message: 'Account found in applicant only.',
          data: {
            name: applicant.name,
            email: applicant.email,
            phone: applicant.phone,
          },
          create: true,
        });
      }
    } else {
      const user = await User.findOne({
        where: {
          [field]: value
        }
      });
      if (user) {
        return res.status(200).json({
          message: 'Account found in users and applicant. Found in user.',
          data: {
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          create: false,
        });
      } else {
        return res.status(404).json({
          message: 'Account not found in users and applicant.',
          data: null,
          create: true,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/* Use for PPO */
router.delete('/logout/v1', verifytoken, async (req, res) => {
  try {
    await User.update({
      token: null
    }, {
      where: {
        identity: req.user.data.identity
      }
    });
    res.clearCookie('refreshTokenPMBOnlineV1');
    return res.status(200).json({ message: 'Successfully logged out.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* Use for TGB, Psikotest */
router.delete('/logout/v2', verifytoken, async (req, res) => {
  try {
    await User.update({
      token: null
    }, {
      where: {
        identity: req.user.data.identity
      }
    });
    res.clearCookie('refreshTokenPMBOnlineV2');
    return res.status(200).json({ message: 'Successfully logged out.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* Use for SBPMB */
router.delete('/logout/v3', verifytoken, async (req, res) => {
  try {
    await User.update({
      token: null
    }, {
      where: {
        identity: req.user.data.identity
      }
    });
    res.clearCookie('refreshTokenPMBOnlineV3');
    return res.status(200).json({ message: 'Successfully logged out.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;