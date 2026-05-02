const axios = require("axios");
const FormData = require("form-data");

async function uploadToIPFS(fileBuffer, fileName) {
  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, fileName);

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
        }
      }
    );

    console.log("IPFS CID:", res.data.IpfsHash);

    return res.data.IpfsHash;
  } catch (err) {
    console.error("IPFS Upload Error:", err.response?.data || err.message);
    throw new Error("IPFS upload failed");
  }
}

module.exports = { uploadToIPFS };