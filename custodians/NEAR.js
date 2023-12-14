const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const sleep = require("../utils/sleep");
require("dotenv").config();

class NEAR extends TanganyParams {
  constructor() {
    super();
    this.env = process.env;
  }

  filter_near_response(res) {
    return res?.txns.filter((element) => {
      let log = element["logs"][0]?.replaceAll("\\", "");
      log = log?.replace("EVENT_JSON:", "");
      try {
        let json_log = log !== undefined ? JSON.parse(log) : null;
      } catch (error) {
        let json_log = null;
      }
      return !this.date_is_earlier_than_today(
        parseInt(element["block_timestamp"]) / 1000000
      );
    });
  }
  async near_request(url, from_date, to_date) {
    url = `${url}/${this.env.NEAR_ACCOUNT_ID}/txns?`;
    let res = this.filter_near_response(
      await fetch(url).then(async (res) => await res.json())
    );
    let all_res = [...res];
    while (res.length === 25) {
      res = await fetch(
        this.json_to_query_params(url, {
          page: parseInt(all_res.length / 25 + 1),
        })
      ).then(async (res) => await res.json());
      res = this.filter_near_response(res);
      all_res = [...res, ...all_res];
    }

    console.log("first");
  }
}
module.exports = NEAR;

