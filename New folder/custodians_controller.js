const ed = require("@noble/ed25519");
// const fetch = require("node-fetch");
let nonce_lib = require("nonce-next");
require("dotenv").config();
const {
  stringToByteArray,
  getBytes,
  getSignature,
  byteArrayToHexString,
  toUriFormat,
} = require("../helpers/inputs_manipulator");

class CustodiansController {
  constructor() {
    const env = process.env;
    this.public_key = env.DLT_PUBLIC_KEY;
    this.private_key = env.DLT_PRIVATE_KEY;
  }
  async dlt_request(from_date, to_date) {
    let nonce = nonce_lib.generate() * 10000;
    let page = 0;
    let limit = 100000;

    let today = new Date(new Date().setHours(new Date().getHours() + 3))
      .toISOString()
      .split(".")[0]
      .split("T")
      .join(" ")
      .toString();
    let yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .split(".")[0]
      .split("T")
      .join(" ")
      .toString();
    let from_input = yesterday.split(" ");
    let to_input = today.split(" ");
    let from = `${from_input[0]}T${from_input[1]}Z`;
    let to = `${to_input[0]}T${to_input[1]}Z`;

    const from_msg = toUriFormat(from);
    const to_msg = toUriFormat(to);

    const decoded_message = getBytes(
      `GET/v1/report/custody/client/deposits?from=${from}&to=${to}&state=done&page=${page}&limit=${limit}${nonce}`
    );

    const decoded_signature = stringToByteArray(this.private_key.substring(0, 64));

    let signature = await getSignature(decoded_message, decoded_signature);
    signature = byteArrayToHexString(signature);

    const promise = await fetch(
      `https://api.dltm.quanttradingfactory.com/v1/report/custody/client/deposits?from=${from}&to=${to}&state=${"done"}&page=${page}&limit=${limit}`,
      {
        headers: {
          "X-Public-Key": this.public_key,
          "X-Signature": signature,
          "X-Nonce": nonce,
        },
      }
    ).then((res) => {
      return res.json();
    });
    return promise.records;
  }
}
