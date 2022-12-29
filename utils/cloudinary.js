const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name:'dbatsdukp', 
    api_key: '752232322982553', 
    api_secret:'rQ2PuJ58iyMvrK5XqjWKMZ-_XO8'
  });

  module.exports = cloudinary;