const ed = require("@noble/ed25519");

function getDateTime() {
  const t = new Date();
  const date = ("0" + t.getDate()).slice(-2);
  const month = ("0" + (t.getMonth() + 1)).slice(-2);
  const year = t.getFullYear();
  const hours = ("0" + t.getHours()).slice(-2);
  const minutes = ("0" + t.getMinutes()).slice(-2);
  const seconds = ("0" + t.getSeconds()).slice(-2);
}

function stringToByteArray(string) {
  let nbOfChars = string.length;
  let bytes = [];
  for (let i = 0; i < nbOfChars; i += 2) {
    let encoded = parseInt(string.substring(i, i + 2), 16);
    bytes[i / 2] = encoded;
  }
  // bytes = Uint8Array.from(bytes);
  return bytes;
}

function getBytes(string) {
  let byte_array = [];
  for (let i = 0; i < string.length; i++) {
    byte_array.push(string.charCodeAt(i));
  }
  return byte_array;
}

async function getSignature(decoded_message, decoded_signature) {
  const signature = await ed.sign(
    Uint8Array.from(decoded_message),
    Uint8Array.from(decoded_signature)
  );
  return signature;
}

function byteArrayToHexString(byteArray) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

function toUriFormat(initial_msg) {
  let curr_msg = "";
  for (let i = 0; i < initial_msg.length; i++) {
    if (initial_msg[i] == ":") {
      curr_msg += "%3A";
    } else {
      curr_msg += initial_msg[i];
    }
  }
  return curr_msg;
}



function checkDateFormats(date) {
  splitted_date = date.split(/[:\s-]+/);

  if (new Date(splitted_date.slice(0, 3).join(" ")) === "Invalid Date") {
    throw new Error("Invalid Date Format");
  }

  if (new Date(date) === "Invalid Date") {
    throw new Error("Invalid Time Format");
  }
}

module.exports = {
  stringToByteArray,
  getBytes,
  getSignature,
  byteArrayToHexString,
  toUriFormat,
  
};
    