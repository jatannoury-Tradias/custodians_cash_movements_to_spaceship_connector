const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");
require("dotenv").config();

class HBAR extends TanganyParams {
  constructor() {
    super();
    const env = process.env;
    this.dg_access_key = this.dg_access_key;
  }
  async do_hbar_request(url, params, from = 0) {
    const { consensusStartInEpoch, consensusEndInEpoch } = params;
    const request_url = this.json_to_query_params(url, {
      consensusStartInEpoch,
      consensusEndInEpoch,
      from,
    });
    const res = await fetch(request_url, {
      method: "GET",
      headers: {
        "X-API-KEY": this.dg_access_key,
      },
    }).then(async (res) => await res.json());
    return res;
  }
  async hbar_request(url, from_date, to_date) {
    let params = this.get_hbar_params(from_date);
    url = `${url}/${params["tradias_wallet"]}/transactions?`;

    let all_hbar_res = [];
    let hbar_res = await this.do_hbar_request(url, params);
    all_hbar_res = [...hbar_res["data"]];
    //PAGINATION
    while (hbar_res["totalCount"] - all_hbar_res.length !== 0) {
      let from = all_hbar_res.length;
      let hbar_res = await this.do_hbar_request(url, params, from);
      all_hbar_res = [...all_hbar_res, ...hbar_res["data"]];
    }
    return all_hbar_res;
  }
}
module.exports = HBAR;
