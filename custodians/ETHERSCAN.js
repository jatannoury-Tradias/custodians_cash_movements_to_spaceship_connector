const TanganyParams = require("../config/tangany_params");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");

class Etherscan extends TanganyParams {
  constructor() {
    super();
  }
  async do_eth_request(url, params) {
    Object.keys(params).forEach((key) => {
      url += `${key}=${params[key]}&`;
    });
    return await fetch(url).then(async (res) => {
      return await response_parser(
        res,
        200,
        `Etherscan for address ${params.address}`
      );
    });
  }
  async eth_request(url, from_date = null, to_date = null, requests_addresses) {
    let all_addresses_cash_mvts = {
      tokentx: [],
      txlist: [],
    };
    const {
      ETH_ERCTOKEN_queryParams,
      ETH_INTERNAL_queryParams,
      ETH_NORMAL_queryParams,
    } = await this.get_eth_params(from_date, to_date);
    for (const address of requests_addresses.etherscan) {
      ETH_ERCTOKEN_queryParams.address = address;
      ETH_NORMAL_queryParams.address = address;
      await sleep(1000);
      let erc_request = await this.do_eth_request(
        url,
        ETH_ERCTOKEN_queryParams
      );
      let normal_request = await this.do_eth_request(
        url,
        ETH_NORMAL_queryParams
      );
      if (Array.isArray(erc_request?.result)) {
        all_addresses_cash_mvts.tokentx = [
          ...all_addresses_cash_mvts.tokentx,
          ...erc_request?.["result"],
        ];
      }
      if (Array.isArray(normal_request?.result)) {
        all_addresses_cash_mvts.txlist = [
          ...all_addresses_cash_mvts.txlist,
          ...normal_request?.["result"],
        ];
      }
      await sleep(this.mapped_timeouts.etherscan);
    }
    return all_addresses_cash_mvts;
  }
}
module.exports = Etherscan;
