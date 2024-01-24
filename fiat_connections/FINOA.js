const FiatParams = require("../config/fiat_connections_params");
const { FINOA_URL } = require("../config/fiat_connections_url");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const crypto = require("crypto");

require("dotenv").config();

class FINOA extends FiatParams {
  constructor() {
    super();
    this.authorization_headers = {};
  }
  get_timestamp() {
    const now = new Date();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayOfWeek = daysOfWeek[now.getUTCDay()];
    const dayOfMonth = now.getUTCDate().toString().padStart(2, "0");
    const month = months[now.getUTCMonth()];
    const year = now.getUTCFullYear();
    const hours = now.getUTCHours().toString().padStart(2, "0");
    const minutes = now.getUTCMinutes().toString().padStart(2, "0");
    const seconds = now.getUTCSeconds().toString().padStart(2, "0");

    const formattedTimestamp = `${dayOfWeek}, ${dayOfMonth} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;

    return formattedTimestamp;
  }
  generate_hash(decodedSecret, message) {
    const hmac = crypto.createHmac(
      "sha256",
      Buffer.from(decodedSecret, "utf8")
    );
    hmac.update(Buffer.from(message, "utf8"));
    return hmac.digest("hex");
  }
  get_digest(timestamp, url) {
    var message = timestamp + "GET" + url;
    let decodedSecret = atob(this.finoa_data.finoa_secret);
    let signature = this.generate_hash(decodedSecret, message);

    return signature;
  }
  get_auth_headers(url) {
    var timestamp = this.get_timestamp();
    var accountCredentials =
      this.finoa_data.finoa_passphrase +
      ":" +
      this.finoa_data.finoa_confirm_code;
    var authorization = btoa(accountCredentials);

    var signature = this.get_digest(timestamp, `/v1/transactions`);

    this.authorization_headers = {
      "Finoa-Api-Digest": signature,
      Authorization: `Basic ${authorization}`,
      Date: timestamp,
      "Finoa-Api-Key": this.finoa_data.finoa_key,
    };
    console.log(this.authorization_headers);
  }
  async finoa_request(url, from_date, to_date) {
    var timestamp = this.get_timestamp();
    var accountCredentials =
      this.finoa_data.finoa_passphrase +
      ":" +
      this.finoa_data.finoa_confirm_code;
    var authorization = btoa(accountCredentials);

    var signature = this.get_digest(timestamp, `/v1/transactions`);
    const HEADERS = {
      "Finoa-Api-Key": this.finoa_data.finoa_key,
      Date: timestamp,
      Authorization: `Basic ${authorization}`,
      "Finoa-Api-Digest": signature,
      "Content-Type": "application/json",
    };
    let res = await fetch(`${url}/v1/transactions`, {
      method: "GET",
      headers: HEADERS,
    }).then(async (res) => {
      let content = await res.text();
      let json_content = await res.json();
      console.log("first");
    });

    console.log(res.statusText);
  }
}

module.exports = FINOA;
if (require.main === module) {
  async function initialize() {
    let test = new FINOA();
    await test.finoa_request(FINOA_URL);
  }
  initialize();
}
