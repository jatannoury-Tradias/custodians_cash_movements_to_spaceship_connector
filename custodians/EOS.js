const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");

class EOS extends TanganyParams {
  constructor() {
    super();
  }
  
  async do_eos_request(url, from_date = null, to_date = null, position = null) {
    let params = this.get_eos_params();
    const request_url = this.json_to_query_params(url, {
      account_name: params["account_name"],
    });
    const res = await fetch(request_url, {
      method: "POST",
      body: JSON.stringify(params),
    }).then(async (res) => await res.json());
    return res;
  }
  async eos_request(url, from_date = null, to_date = null) {
    let eos_res = await this.do_eos_request(
      url,
      (from_date = null),
      (to_date = null),
      this.get_eos_params()["pos"]
    ).then((res) => {
      return res["actions"];
    });
    // Pagination
    while (!this.date_is_earlier_than_today(eos_res[0]["block_time"])) {
      eos_res = [await this.do_eos_request(url, null, null, 2), ...eos_res];
    }
    eos_res = eos_res.filter(
      (element) => !this.date_is_earlier_than_today(element["block_time"])
    );
    return eos_res;
  }
}
module.exports = EOS;
