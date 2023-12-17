const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const sleep = require("../utils/sleep");
require("dotenv").config();

class XTZ extends TanganyParams {
  constructor() {
    super();
  }
  async do_xtz_request(url, lastId = null) {
    const request_url = this.json_to_query_params(
      url,
      this.get_xtz_params(lastId)
    );
    return await fetch(request_url).then(async (res) => {
      return await res.json();
    });
  }
  async xtz_request(url, from_date, to_date) {
    url = `${url}/${this.xtz_tradias_wallet}/operations?`;
    let res = await this.do_xtz_request(url);
    let all_res = [...res];
    while (!this.date_is_earlier_than_today(all_res[all_res.length - 1]['timestamp'])) {
      res = await this.do_xtz_request(url,all_res[all_res.length - 1]['id']);
      all_res = [...all_res, ...res];
    }
    all_res = all_res.filter(
      (element) => !this.date_is_earlier_than_today(element.timestamp)
    );
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
module.exports = XTZ;
