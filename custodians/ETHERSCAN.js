const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");

class Etherscan extends TanganyParams{
  constructor() {
    super()
  }
  async do_eth_request(url, params) {
    Object.keys(params).forEach((key) => {
      url += `${key}=${params[key]}&`;
    });
    return await fetch(url).then((res) => {
      return res.json();
    });
  }
  async eth_request(url, from_date = null, to_date = null) {
    const {
      ETH_ERCTOKEN_queryParams,
      ETH_INTERNAL_queryParams,
      ETH_NORMAL_queryParams,
    } = await this.get_eth_params(from_date, to_date);
    await sleep(5000);
    let erc_request = await this.do_eth_request(url, ETH_ERCTOKEN_queryParams);
    let int_request = await this.do_eth_request(url, ETH_INTERNAL_queryParams);
    let normal_request = await this.do_eth_request(url, ETH_NORMAL_queryParams);
    return {
      tokentx:[...erc_request["result"].map((element) => {
        element["request_type"] = "ERC20";
        return element;
      })],
      internal:[...int_request["result"].map((element) => {
        element["request_type"] = "INTERNAL";
        return element;
      })],
      txlist:[...normal_request["result"].map((element) => {
        element["request_type"] = "NORMAL";
        return element;
      })],
    };
  }
}
module.exports = Etherscan
