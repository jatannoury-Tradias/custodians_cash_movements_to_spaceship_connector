const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");
require("dotenv").config();

class CELO extends TanganyParams {
  constructor() {
    super();
  }
  async do_celo_request(url, params) {
    const request_url = this.json_to_query_params(url, params);
    return await fetch(request_url).then(async (res) => {
      return await response_parser(res, 200, `CELO address ${params.address}`);
    });
  }
  async filter_celo_response(celo_res, from_date, to_date) {
    return Array.isArray(celo_res?.result)
      ? celo_res.result.filter(
          (element) =>
            !this.date_is_between_input_dates(
              parseInt(element.timeStamp) * 1000,
              from_date,
              to_date
            )
        )
      : [];
  }
  async celo_request(url, from_date, to_date, requests_addresses) {
    let all_celo_res = {
      tokentx: [],
      txlist: [],
    };
    url = `${url}?`;
    for (let address of requests_addresses.celo) {
      let txlist_params = await this.get_celo_params(
        "txlist",
        from_date,
        to_date,
        address
      );
      let tokentx_params = await this.get_celo_params(
        "tokentx",
        from_date,
        to_date,
        address
      );

      all_celo_res.tokentx = [
        ...all_celo_res.tokentx,
        ...(await this.filter_celo_response(
          await this.do_celo_request(url, txlist_params, from_date, to_date)
        )),
      ];
      all_celo_res.txlist = [
        ...all_celo_res.txlist,
        ...(await this.filter_celo_response(
          await this.do_celo_request(url, tokentx_params, from_date, to_date)
        )),
      ];
      await sleep(this.mapped_timeouts.celo);
    }
    return all_celo_res;
  }
}
module.exports = CELO;  
