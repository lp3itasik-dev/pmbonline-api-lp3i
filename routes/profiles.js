const express = require('express');
const router = express.Router();
const {
  User,
  UserUpload,
  Applicant,
  ApplicantFamily,
  ApplicantStatus,
  School,
  SourceSetting,
  FollowUp,
  FileUpload,
  ProgramType,
  Achievement,
  Organization,
} = require('../models');
const verifytoken = require('../middlewares/verifytoken');
const verifyapikey = require('../middlewares/verifyapikey');
const { Op } = require('sequelize');

const getFileUploadByType = async (identityUser, fileType) => {
  return await UserUpload.findOne({
    where: { identity_user: identityUser },
    include: {
      model: FileUpload,
      as: 'fileupload',
      where: { namefile: fileType }
    }
  });
}

const validateApplicantData = (applicant) => {
  return applicant.name &&
    applicant.gender !== null &&
    applicant.placeOfBirth &&
    applicant.dateOfBirth &&
    applicant.religion &&
    applicant.school &&
    applicant.major &&
    applicant.class &&
    applicant.year &&
    applicant.incomeParent &&
    applicant.socialMedia &&
    applicant.address
};

const validateApplicantProgram = (applicant) => {
  return applicant.program && applicant.programSecond;
};

const validateApplicantFather = (father) => {
  return father.name &&
    father.placeOfBirth &&
    father.dateOfBirth &&
    father.phone &&
    father.education &&
    father.job &&
    father.address
};

const validateApplicantMother = (mother) => {
  return mother.name &&
    mother.placeOfBirth &&
    mother.dateOfBirth &&
    mother.phone &&
    mother.education &&
    mother.job &&
    mother.address
};

/* Use for PPO, TGB, Psikotest */
router.get('/v1', verifytoken, async (req, res) => {
  try {
    const identityUser = req.user.data.identity;
    const applicant = await Applicant.findOne({
      where: {
        identity: identityUser
      },
      include: [
        { model: School, as: 'schoolapplicant' },
        { model: User, as: 'presenter', attributes: ['identity','name','email','phone'] },
      ]
    });

    const user = await User.findOne({
      where: {
        identity: identityUser
      },
    });

    const achievements = await Achievement.findAll({
      where: {
        identity_user: identityUser
      },
    });

    const organizations = await Organization.findAll({
      where: {
        identity_user: identityUser
      },
    });

    const father = await ApplicantFamily.findOne({
      where: {
        identityUser: identityUser,
        gender: true
      },
    });

    const mother = await ApplicantFamily.findOne({
      where: {
        identityUser: identityUser,
        gender: false
      },
    });

    const userUpload = await UserUpload.findAll({
      where: {
        identityUser: identityUser,
      },
      include: [
        { model: FileUpload, as: 'fileupload' }
      ],
    });

    const fileuploadIds = userUpload.map(upload => upload.fileuploadId);

    const fileuploaded = await FileUpload.findAll({
      where: {
        id: fileuploadIds
      }
    });

    const fileupload = await FileUpload.findAll({
      where: {
        id: {
          [Op.notIn]: fileuploadIds
        },
        namefile: {
          [Op.in]: [
            "foto",
            "akta-kelahiran",
            "kartu-keluarga",
            "sertifikat-pendukung",
            "foto-rumah-luar-dan-dalam",
            "bukti-tarif-daya-listrik",
          ]
        }
      }
    });

    const foto = await getFileUploadByType(identityUser, 'foto');
    const aktaKelahiran = await getFileUploadByType(identityUser, 'akta-kelahiran');
    const sertifikatPendukung = await getFileUploadByType(identityUser, 'sertifikat-pendukung');
    const fotoRumah = await getFileUploadByType(identityUser, 'foto-rumah-luar-dan-dalam');
    const buktiTarifDaya = await getFileUploadByType(identityUser, 'bukti-tarif-daya-listrik');

    const isValidData = validateApplicantData(applicant);
    const isValidProgram = validateApplicantProgram(applicant);
    const isValidFather = validateApplicantFather(father);
    const isValidMother = validateApplicantMother(mother);
    const isValidFiles = foto && aktaKelahiran && sertifikatPendukung && fotoRumah && buktiTarifDaya;
    const isValid = isValidData && isValidProgram && isValidFather && isValidMother && isValidFiles;

    return res.status(200).json({
      applicant: {
        identity: applicant.identity,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        avatar: user.avatar,
        gender: applicant.gender,
        religion: applicant.religion,
        place_of_birth: applicant.placeOfBirth,
        date_of_birth: applicant.dateOfBirth,
        address: applicant.address,
        school_id: applicant.school,
        major: applicant.major,
        class: applicant.class,
        year: applicant.year,
        program: applicant.program,
        program_second: applicant.programSecond,
        income_parent: applicant.incomeParent,
        social_media: applicant.socialMedia,
        role: user.role,
        status: user.status,
        school: applicant.schoolapplicant ? applicant.schoolapplicant.name : null,
      },
      father: {
        name: father.name,
        phone: father.phone,
        place_of_birth: father.placeOfBirth,
        date_of_birth: father.dateOfBirth,
        job: father.job,
        education: father.education,
        address: father.address
      },
      mother: {
        name: mother.name,
        phone: mother.phone,
        place_of_birth: mother.placeOfBirth,
        date_of_birth: mother.dateOfBirth,
        job: mother.job,
        education: mother.education,
        address: mother.address
      },
      achievements: achievements,
      organizations: organizations,
      userupload: userUpload,
      fileupload: fileupload,
      fileuploaded: fileuploaded,
      validate: {
        validate: isValid,
        validate_data: isValidData,
        validate_program: isValidProgram,
        validate_father: isValidFather,
        validate_mother: isValidMother,
        validate_files: isValidFiles
      },
    });
  } catch (error) {
    return res.json({
      message: error.message
    });
  }
});

router.get('/phone/:phone/v1', verifyapikey, async (req, res) => {
  try {
    const phone = req.params.phone;
    const applicant = await Applicant.findOne({
      where: {
        phone: phone
      },
      include: [
        { model: School, as: 'schoolapplicant', attributes: ['name','region'] },
        { model: User, as: 'presenter', attributes: ['identity','name','email','phone'] },
        { model: ApplicantStatus, as: 'applicantStatus', attributes: ['name'] },
        { model: SourceSetting, as: 'sourcesetting', attributes: ['name'] },
        { model: SourceSetting, as: 'sourcedaftarsetting', attributes: ['name'] },
        { model: FollowUp, as: 'followup', attributes: ['name'] },
        { model: ProgramType, as: 'programtype', attributes: ['name'] },
      ]
    });

    const user = await User.findOne({
      where: {
        phone: phone
      },
    });

    const achievements = await Achievement.findAll({
      where: {
        identity_user: user.identity
      },
    });

    const organizations = await Organization.findAll({
      where: {
        identity_user: user.identity
      },
    });

    const father = await ApplicantFamily.findOne({
      where: {
        identityUser: user.identity,
        gender: true
      },
    });

    const mother = await ApplicantFamily.findOne({
      where: {
        identityUser: user.identity,
        gender: false
      },
    });

    const userUpload = await UserUpload.findAll({
      where: {
        identityUser: user.identity,
      },
      include: [
        { model: FileUpload, as: 'fileupload' }
      ],
    });

    const fileuploadIds = userUpload.map(upload => upload.fileuploadId);

    const fileuploaded = await FileUpload.findAll({
      where: {
        id: fileuploadIds
      }
    });

    const fileupload = await FileUpload.findAll({
      where: {
        id: {
          [Op.notIn]: fileuploadIds
        },
        namefile: {
          [Op.in]: [
            "foto",
            "akta-kelahiran",
            "kartu-keluarga",
            "sertifikat-pendukung",
            "foto-rumah-luar-dan-dalam",
            "bukti-tarif-daya-listrik",
          ]
        }
      }
    });

    const foto = await getFileUploadByType(user.identity, 'foto');
    const aktaKelahiran = await getFileUploadByType(user.identity, 'akta-kelahiran');
    const sertifikatPendukung = await getFileUploadByType(user.identity, 'sertifikat-pendukung');
    const fotoRumah = await getFileUploadByType(user.identity, 'foto-rumah-luar-dan-dalam');
    const buktiTarifDaya = await getFileUploadByType(user.identity, 'bukti-tarif-daya-listrik');

    const isValidData = validateApplicantData(applicant);
    const isValidProgram = validateApplicantProgram(applicant);
    const isValidFather = validateApplicantFather(father);
    const isValidMother = validateApplicantMother(mother);
    const isValidFiles = foto && aktaKelahiran && sertifikatPendukung && fotoRumah && buktiTarifDaya;
    const isValid = isValidData && isValidProgram && isValidFather && isValidMother && isValidFiles;

    return res.status(200).json({
      applicant: {
        identity: applicant.identity,
        nik: applicant.nik,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        avatar: user.avatar,
        gender: applicant.gender,
        religion: applicant.religion,
        place_of_birth: applicant.placeOfBirth,
        date_of_birth: applicant.dateOfBirth,
        address: applicant.address,
        school_id: applicant.school,
        major: applicant.major,
        class: applicant.class,
        year: applicant.year,
        program: applicant.program,
        program_second: applicant.programSecond,
        income_parent: applicant.incomeParent,
        social_media: applicant.socialMedia,
        role: user.role,
        status: user.status,
        school: applicant.schoolapplicant ? applicant.schoolapplicant.name : null,
        identityUser: applicant.identityUser,
        presenter: applicant.identityUser ? applicant.presenter : null,
      },
      father: {
        name: father.name,
        phone: father.phone,
        place_of_birth: father.placeOfBirth,
        date_of_birth: father.dateOfBirth,
        job: father.job,
        education: father.education,
        address: father.address
      },
      mother: {
        name: mother.name,
        phone: mother.phone,
        place_of_birth: mother.placeOfBirth,
        date_of_birth: mother.dateOfBirth,
        job: mother.job,
        education: mother.education,
        address: mother.address
      },
      achievements: achievements,
      organizations: organizations,
      userupload: userUpload,
      fileupload: fileupload,
      fileuploaded: fileuploaded,
      validate: {
        validate: isValid,
        validate_data: isValidData,
        validate_program: isValidProgram,
        validate_father: isValidFather,
        validate_mother: isValidMother,
        validate_files: isValidFiles
      },
    });
  } catch (error) {
    return res.json({
      message: error.message
    });
  }
});

module.exports = router;