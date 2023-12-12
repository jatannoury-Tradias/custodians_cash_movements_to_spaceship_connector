const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");
require("dotenv").config();

class OKLINK extends TanganyParams {
  constructor() {
    super();
    const env = process.env;

    this.oklink_access_key = env.OKLINK_ACCESS_KEY;
  }
  async do_oklink_request(method, url, page = 1) {
    const request_url = this.json_to_query_params(
      url,
      this.get_atom_params(page)
    );
    return await fetch(request_url, {
      method,
      headers: {
        "OK-ACCESS-KEY": this.oklink_access_key,
      },
    }).then(async (res) => await res.json());
  }
  async atom_request(url, from_date = null, to_date = null) {
    url = `${url}/v5/explorer/address/normal-transaction-cosmos?`;
    let atom_res = await this.do_oklink_request("GET", url);
    let all_atom_res = [...(atom_res?.data?.transactionList || [])];
    // Pagination
    while (atom_res["data"]["page"] !== atom_res["data"]["totalPage"]) {
      atom_res = await this.do_oklink_request(
        "GET",
        url,
        parseInt(atom_res["data"]["page"]) + 1
      );
      all_atom_res = [
        ...(atom_res?.data?.transactionList || []),
        ...all_atom_res,
      ];
    }
    // eos_res = eos_res.filter(
    //   (element) => !this.date_is_earlier_than_today(element["block_time"])
    // );
    return all_atom_res;
  }
}
module.exports = OKLINK;
