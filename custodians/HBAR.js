const TanganyParams = require("../config/tangany_params");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");
require("dotenv").config();

class HBAR extends TanganyParams {
  constructor() {
    super();
    this.dg_access_key = this.dg_access_key;
  }
  async do_hbar_request(url, params, address, from = 0) {
    const { consensusStartInEpoch, consensusEndInEpoch } = params;
    const request_url = this.json_to_query_params(url, {
      consensusStartInEpoch,
      consensusEndInEpoch,
      from,
    });
    return await fetch(request_url, {
      method: "GET",
      headers: {
        "X-API-KEY": this.dg_access_key,
      },
    }).then(
      async (res) =>
        await response_parser(res, 200, `HBAR for address ${address}`)
    );
  }
  async hbar_request(url, from_date, to_date, requests_addresses) {
    let all_hbar_data = {
      txlist: [],
    };
    for (let address of requests_addresses.hbar) {
      let curr_hbar_data = [];
      let params = this.get_hbar_params(from_date, to_date, address);
      url = `${url}/${address}/transactions?`;

      let hbar_res = await this.do_hbar_request(url, params, address);
      curr_hbar_data = [...hbar_res["data"]];
      //PAGINATION
      while (hbar_res["totalCount"] - curr_hbar_data.length !== 0) {
        let from = curr_hbar_data.length;
        let hbar_res = await this.do_hbar_request(url, params, address, from);
        curr_hbar_data.txlist = [...curr_hbar_data, ...hbar_res["data"]];
      }
      all_hbar_data.txlist = [...all_hbar_data.txlist, ...curr_hbar_data];
      await sleep(this.mapped_timeouts.hbar)
    }

    return all_hbar_data;
  }
}
module.exports = HBAR;
