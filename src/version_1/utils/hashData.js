import * as CryptoJS from "crypto-js";

export const encryptString = ({ str, secretKey }) => {
  const keyHex = CryptoJS.enc.Utf8.parse(""
    // secretKey ? secretKey : process.env.REACT_APP_SECRETKEY
  );
  const encrypted = CryptoJS.AES.encrypt(str, keyHex.toString());
  const encryptedStr = CryptoJS.enc.Base64.parse(encrypted.toString());

  return CryptoJS.enc.Hex.stringify(encryptedStr);
};

export const decryptString = ({ encryptedStr, secretKey }) => {
  const keyHex = CryptoJS.enc.Utf8.parse(""
    // secretKey ? secretKey : process.env.REACT_APP_SECRETKEY
  );
  const wordArray = CryptoJS.enc.Hex.parse(encryptedStr);
  const toDecrypt = CryptoJS.enc.Base64.stringify(wordArray);
  const decryptedStr = CryptoJS.AES.decrypt(toDecrypt, keyHex.toString());

  return decryptedStr.toString(CryptoJS.enc.Utf8);
};