const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const { response_parser } = require("../utils/response_parser");
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
  async near_request(url, from_date, to_date, requests_addresses) {
    let near_all_data = {
      txlist: [],
    };
    for (let address of requests_addresses.near) {
      let res = this.filter_near_response(
        await fetch(`${url}/${address}/txns?`).then(
          async (res) =>
            await response_parser(res, 200, `NEAR for address ${address}`)
        )
      );
      near_all_data.txlist = [...res, ...near_all_data.txlist];
      while (res.length === 25) {
        res = await fetch(
          this.json_to_query_params(`${url}/${address}/txns?`, {
            page: parseInt(all_res.length / 25 + 1),
          })
        ).then(
          async (res) =>
            await response_parser(res, 200, `NEAR for address ${address}`)
        );
        res = this.filter_near_response(res);
        near_all_data.txlist = [...res, ...near_all_data.txlist];
      }
      await sleep(this.mapped_timeouts.near);
    }

    return near_all_data.txlist.filter((element) =>
      this.date_is_between_input_dates(
        parseInt(element.block_timestamp) / 10 ** 6,
        from_date,
        to_date
      )
    );
  }
}
module.exports = NEAR;
