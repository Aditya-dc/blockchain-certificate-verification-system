import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000"
});

export const issueCertificate = (formData) =>
  API.post("/issue", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

export const verifyCertificate = (formData) =>
  API.post("/verify", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
