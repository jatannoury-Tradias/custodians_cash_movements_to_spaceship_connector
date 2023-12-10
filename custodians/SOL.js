const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");
require("dotenv").config();

class SOL extends TanganyParams {
  constructor() {
    super();
  }

  async sol_request(url, from_date, to_date) {
    const request_url = this.json_to_query_params(url, this.get_sol_params());
    const res = await fetch(request_url).then(async (res) => res);
    return res;
  }
}
module.exports = SOL;
