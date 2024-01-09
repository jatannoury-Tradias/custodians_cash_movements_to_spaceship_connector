const {
  get_curr_day_to_curr_plus_one_midnight_date,
  get_curr_day_minus_one_to_curr_day_midnight_date,
} = require("../utils/date_utils");
const POLYGON_ALLOWED_ACTIONS = require("./custodians_specific_params/POLYGON_ALLOWED_ACTIONS.JS");
const {
  ETHERSCAN_URL,
  EOS_URL,
  HBAR_URL,
  SOL_URL,
  POLYGON_URL,
  FTM_URL,
  KSM_URL,
} = require("./tangany_urls");
require("dotenv").config();

class FiatParams {
  constructor() {
    const env = process.env;
    this.bcb_data = {
      bcb_client_id: env.BCB_CLIENT_ID,
      bcb_secret: env.BCB_CLIENT_SECRET,
      bcb_passphrase: env.BCB_PASSPHRASE,
      bcb_audience: env.BCB_AUDIENCE,
      bcb_token: env.BCB_TOKEN,
    };
    this.finoa_data = {
      finoa_key: env.FINOA_KEY,
      finoa_secret: env.FINOA_SECRET,
      finoa_passphrase: env.FINOA_PASSPHRASE,
      finoa_confirm_code: env.FINOA_CONFIRM_CODE,
    };
  }
  date_is_earlier_than_today(cash_mvt_block_time) {
    // Create a new Date object in UTC using the values from the original date
    let originalDate = new Date(cash_mvt_block_time);

    // Adjust for the local time zone offset
    let localOffset = originalDate.getTimezoneOffset();
    let blockTime = new Date(originalDate.getTime() + localOffset * 60 * 1000);
    let currentDate = new Date();
    currentDate = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        currentDate.getUTCHours(),
        currentDate.getUTCMinutes(),
        currentDate.getUTCSeconds(),
        currentDate.getUTCMilliseconds()
      )
    );
    // Extract day, month, and year components from blockTime
    const blockDay = blockTime.getDate();
    const blockMonth = blockTime.getMonth();
    const blockYear = blockTime.getFullYear();

    // Extract day, month, and year components from currentDate
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Compare the dates by day only
    if (
      blockYear < currentYear ||
      (blockYear === currentYear && blockMonth < currentMonth) ||
      (blockYear === currentYear &&
        blockMonth === currentMonth &&
        blockDay < currentDay)
    ) {
      return true;
    } else {
      return false;
    }
  }
  json_to_query_params(url, query_params_json) {
    Object.keys(query_params_json).forEach((key) => {
      url += `${key}=${query_params_json[key]}&`;
    });
    return url;
  }
  unix_to_date_string(timestamp) {
    const date = new Date(timestamp);

    // Extract year, month, and day
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0");

    // Format the date as 'YYYY-MM-DD'
    return `${year}-${month}-${day}`;
  }
  get_bcb_body(page = 0, from_date = null, to_date = null) {
    const { start_date_timestamp, end_time_timestamp } =
      get_curr_day_minus_one_to_curr_day_midnight_date(from_date);
    return {
      dateFrom: this.unix_to_date_string(
        from_date === null ? start_date_timestamp : from_date
      ),
      dateTo: this.unix_to_date_string(
        to_date === null ? end_time_timestamp : to_date
      ),
      limit: 1000,
      page: page,
    };
  }
}
module.exports = FiatParams;
