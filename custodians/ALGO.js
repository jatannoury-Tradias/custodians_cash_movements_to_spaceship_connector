const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const sleep = require("../utils/sleep");
require("dotenv").config();

class ALGO extends TanganyParams {
  constructor() {
    super();
  }
  async do_celo_request(url, params) {
    const request_url = this.json_to_query_params(url, params);
    return await fetch(request_url).then(async (res) => await res.json());
  }
  filter_celo_response(celo_res) {
    return celo_res.result.filter(
      (element) =>
        !this.date_is_earlier_than_today(parseInt(element.timeStamp) * 1000)
    );
  }
  async algo_request(url, from_date, to_date) {
    url = `${url}?`;
    let txlist_params = this.get_celo_params("txlist");
    let tokentx_params = this.get_celo_params("tokentx");
    return {
      txlist: this.filter_celo_response(
        await this.do_celo_request(url, txlist_params)
      ),
      tokentx: this.filter_celo_response(
        await this.do_celo_request(url, tokentx_params)
      ),
    };
  }
}
module.exports = ALGO;
