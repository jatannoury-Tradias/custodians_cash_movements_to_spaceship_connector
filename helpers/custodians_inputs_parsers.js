let nonce_lib = require("nonce-next");
const {
  stringToByteArray,
  getBytes,
  getSignature,
  byteArrayToHexString,
} = require("../helpers/inputs_manipulator");
const CustodiansRequests = require("./custodians_requests");

class CustodiansInputsParser extends CustodiansRequests {
  constructor() {
    super();
    const env = process.env;
    this.public_key = env.DLT_PUBLIC_KEY;
    this.private_key = env.DLT_PRIVATE_KEY;
  }
  isValidDateFormat(inputDate) {
    // Define the regular expression pattern for the format YYYY-MM-DD HH:mm:ss
    const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    // Test the input date against the pattern
    return pattern.test(inputDate);
  }
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  getPreviousDayRange() {
    // Get the current date and time
    const currentDate = new Date();

    // Subtract one day from the current date
    const previousDay = new Date(currentDate);
    previousDay.setDate(currentDate.getDate() - 1);

    // Set the time to 00:00:00 for the start of the day
    previousDay.setHours(0, 0, 0, 0);

    // Create a new date object for the end of the day (11:59:59 PM)
    const endOfDay = new Date(previousDay);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      yesterday: this.formatDate(previousDay),
      today: this.formatDate(endOfDay),
    };
  }
  check_for_input_dates(from_date, to_date) {
    if (from_date !== null && to_date !== null) {
      if (
        this.isValidDateFormat(from_date) &&
        this.isValidDateFormat(to_date)
      ) {
        return { yesterday: from_date, today: to_date };
      }
    }

    return this.getPreviousDayRange();
  }
  async parse_dlt_request_inputs(from_date, to_date, request_type) {
    let nonce = nonce_lib.generate() * 10000;
    let page = 0;
    let limit = 500;

    const { yesterday, today } = this.check_for_input_dates(from_date, to_date);
    let from_input = yesterday.split(" ");
    let to_input = today.split(" ");
    let from = `${from_input[0]}T${from_input[1]}Z`;
    let to = `${to_input[0]}T${to_input[1]}Z`;

    const decoded_message = getBytes(
      `GET/v1/report/custody/client/${request_type}?from=${from}&to=${to}&state=done&page=${page}&limit=${limit}${nonce}`
    );

    const decoded_signature = stringToByteArray(
      this.private_key.substring(0, 64)
    );

    let signature = await getSignature(decoded_message, decoded_signature);
    signature = byteArrayToHexString(signature);
    return {
      nonce,
      page,
      limit,
      signature,
      from,
      to,
    };
  }
}
module.exports = CustodiansInputsParser;
