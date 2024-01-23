const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");
require("dotenv").config();

class XTZ extends TanganyParams {
  constructor() {
    super();
  }
  async do_xtz_request(url, address, lastId = null) {
    const request_url = this.json_to_query_params(
      url,
      this.get_xtz_params(lastId)
    );
    return await fetch(request_url).then(async (res) => {
      return await response_parser(res, 200, `XTZ for address ${address}`);
    });
  }
  async xtz_request(url, from_date, to_date, requests_addresses) {
    let all_xtz_res = {
      txlist: [],
    };
    for (let address of requests_addresses.xtz) {
      let res = await this.do_xtz_request(
        `${url}/${address}/operations?`,
        address
      );
      all_xtz_res.txlist = [...all_xtz_res.txlist, ...res];
      while (
        all_xtz_res.txlist.length !== 0 &&
        res.length !== 0 &&
        !this.date_is_earlier_than_from_date(
          all_xtz_res.txlist[all_xtz_res.txlist.length - 1]["timestamp"],
          from_date
        )
      ) {
        res = await this.do_xtz_request(
          `${url}/${address}/operations?`,
          address,
          all_xtz_res.txlist[all_xtz_res.txlist.length - 1]["id"]
        );
        all_xtz_res.txlist = [...all_xtz_res.txlist, ...res];
      }
      await sleep(this.mapped_timeouts.xtz);
    }

    return all_xtz_res.txlist.filter((element) =>
      this.date_is_between_input_dates(element.timestamp, from_date, to_date)
    );
  }
}
module.exports = XTZ;
