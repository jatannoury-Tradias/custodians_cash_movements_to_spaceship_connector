const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const sleep = require("../utils/sleep");
require("dotenv").config();

class KSM extends TanganyParams {
  constructor() {
    super();
    const env = process.env;
  }
  async get_block_numbers(from_date = null) {
    const { start_date_timestamp, end_time_timestamp } =
      get_curr_day_to_curr_plus_one_midnight_date(from_date);
    const start_block_nb = await fetch(
      "https://kusama.api.subscan.io/api/scan/block",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Apidog/1.0.0 (https://apidog.com)",
        },
        body: JSON.stringify({
          block_timestamp: start_date_timestamp,
        }),
      }
    ).then(async (res) => await res.json());
    const end_block_nb = await fetch(
      "https://kusama.api.subscan.io/api/scan/block",
      {
        method: "POST",

        body: JSON.stringify({
          block_timestamp: end_time_timestamp,
        }),
      }
    ).then(async (res) => await res.json());
    return `0-${end_block_nb["data"]["block_num"]}`;
  }
  async do_ksm_request(url, block_num_range, from = null) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "Apidog/1.0.0 (https://apidog.com)",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: this.ksm_tradias_wallet,
        block_range: block_num_range,
        page: from ? from : 0,
        row: 100,
      }),
    }).then(async (res) => await res.json());
    return res;
  }
  async ksm_request(url, from_date, to_date) {
    url = `${url}/transfers?`;
    let block_num_range = await this.get_block_numbers(from_date);
    let all_ksm_res = [];
    let ksm_res = await this.do_ksm_request(url, block_num_range);
    all_ksm_res = [...ksm_res["data"]["transfers"]];
    //PAGINATION
    while (ksm_res['data']["count"] - all_ksm_res.length !== 0) {
      let from = all_ksm_res.length;
      let ksm_res = await this.do_ksm_request(
        url,
        block_num_range,
        all_ksm_res.length
      );
      all_ksm_res = [...all_ksm_res, ...(ksm_res?.data?.transfers || [])];
    }
    return all_ksm_res;
  }
}
module.exports = KSM;
