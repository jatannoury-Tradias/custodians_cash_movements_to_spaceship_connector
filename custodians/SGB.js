const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const sleep = require("../utils/sleep");
require("dotenv").config();

class SGB extends TanganyParams {
  constructor() {
    super();
  }
  async do_sgb_request(url) {
    return await fetch(url, {
      headers: this.sgb_headers,
    }).then(async (res) => await res.json());
  }
  async sgb_request(url, from_date, to_date) {
    url = `${url}/address/${this.sgb_tradias_address}/transactions_v2/?`;
    let page = 0;
    let request_url = this.json_to_query_params(url, this.get_sgb_params(page));
    const res = await this.do_sgb_request(request_url);
    let all_res = [...res.data.items];
    while (
      !this.date_is_earlier_than_today(
        all_res[all_res.length - 1]["block_signed_at"]
      )
    ) {
      page += 1;
      request_url = this.json_to_query_params(url, this.get_sgb_params(page));
      const res = await this.do_sgb_request(request_url);
      all_res = [...all_res, ...res.data.items];
    }
    return {
      txlist: all_res.filter(
        (element) =>
          !this.date_is_earlier_than_today(element["block_signed_at"])
      ),
    };
  }
}
module.exports = SGB;
