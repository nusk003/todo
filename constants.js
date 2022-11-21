const dotenv = require("dotenv");

dotenv.config();

const __firebase_api_key__ = process.env.FIREBASE_API_KEY;

module.exports = { __firebase_api_key__ };
