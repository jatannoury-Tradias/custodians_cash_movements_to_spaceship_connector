const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const POLYGON_ALLOWED_ACTIONS = require("./custodians_specific_params/POLYGON_ALLOWED_ACTIONS.JS");
const {
  ETHERSCAN_URL,
  EOS_URL,
  HBAR_URL,
  SOL_URL,
  POLYGON_URL,
  FTM_URL,
  KSM_URL,
} = require("./tangany_urls");
require("dotenv").config();

class TanganyParams {
  constructor() {
    const env = process.env;
    this.etherscan_url = ETHERSCAN_URL;
    this.eos_url = EOS_URL;
    this.hbar_url = HBAR_URL;
    this.sol_url = SOL_URL;
    this.polygon_url = POLYGON_URL;
    this.ftm_url = FTM_URL;
    this.ksm_url = KSM_URL;

    this.hbar_tradias_wallet = env.HBAR_TRADIAS_WALLET;
    this.polygon_tradias_wallet = env.POLYGON_TRADIAS_WALLETS;
    this.ftm_tradias_wallet = env.FTM_TRADIAS_WALLET;
    this.ksm_tradias_wallet = env.KSM_TRADIAS_WALLET;
    this.eos_tradias_acc_name = env.EOS_TRADIAS_ACC_NAME;
    this.eth_tradias_address = env.ETH_TRADIAS_ADDRESS;
    this.sol_tradias_address = env.SOL_TRADIAS_ADDRESS;
    this.eth_tradias_api_key = env.ETH_TRADIAS_API_KEY;
    this.polygon_tradias_api_key = env.POLYGON_ACCESS_KEY;
    this.ftm_tradias_api_key = env.FTM_ACCESS_KEY;
    this.ksm_tradias_api_key = env.KSM_ACCESS_KEY;
  }
  date_is_earlier_than_today(cash_mvt_block_time) {
    const blockTime = new Date(cash_mvt_block_time);
    const currentDate = new Date();


    // Extract day, month, and year components from blockTime
    const blockDay = blockTime.getDate();
    const blockMonth = blockTime.getMonth();
    const blockYear = blockTime.getFullYear();

    // Extract day, month, and year components from currentDate
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Compare the dates by day only
    if (
      blockYear < currentYear ||
      (blockYear === currentYear && blockMonth < currentMonth) ||
      (blockYear === currentYear &&
        blockMonth === currentMonth &&
        blockDay < currentDay)
    ) {
      return true;
    } else {
      return false;
    }
  }
  json_to_query_params(url, query_params_json) {
    Object.keys(query_params_json).forEach((key) => {
      url += `${key}=${query_params_json[key]}&`;
    });
    return url;
  }
  async getBlockNb(block_number_query_param) {
    let url = this.json_to_query_params(
      this.etherscan_url,
      block_number_query_param
    );

    const response = await fetch(url).then((res) => {
      return res.json();
    });

    return response["result"];
  }
  get_hbar_params(from_date = null) {
    const { start_date_timestamp, end_time_timestamp } =
      get_curr_day_to_curr_plus_one_midnight_date(from_date);
    return {
      tradias_wallet: this.hbar_tradias_wallet,
      consensusStartInEpoch: start_date_timestamp,
      consensusEndInEpoch: end_time_timestamp,
    };
  }
  get_polygon_params(from,action) {
    const offset = from + 100;
    return this.polygon_tradias_wallet.split(",").map((address) => ({
      module: "account",
      action: action,
      address: address.trim(), // Assuming addresses may have leading/trailing spaces
      startblock: 0,
      endblock: 99999999,
      page: from !== 0 ? from : 1,
      offset: offset,
      sort: "desc",
      apikey: this.polygon_tradias_api_key,
    }));
  }
  get_eos_params(pos = null, offset = null) {
    return {
      account_name: this.eos_tradias_acc_name,
      pos: pos === null ? -1 : pos,
      offset: offset === null ? -100 : offset,
    };
  }
  get_sol_params(from_date = null) {
    const { start_date_timestamp, end_time_timestamp } =
      get_curr_day_to_curr_plus_one_midnight_date(from_date);
    return {
      account: this.sol_tradias_address,
      limit: 100,
      fromTime: start_date_timestamp,
      toTime: end_time_timestamp,
    };
  }
  async get_eth_params(from_date = null, to_date = null) {
    var ETH_NORMAL_queryParams = {
      module: "account",
      action: "txlist",
      address: this.eth_tradias_address,
      apikey: this.eth_tradias_api_key,
    };
    var ETH_INTERNAL_queryParams = {
      module: "account",
      action: "txlistinternal",
      address: this.eth_tradias_address,
      apikey: this.eth_tradias_api_key,
    };

    var ETH_ERCTOKEN_queryParams = {
      module: "account",
      action: "tokentx",
      address: this.eth_tradias_address,
      apikey: this.eth_tradias_api_key,
    };
    let current_date =
      from_date === null ? new Date().getDate() - 1 : from_date;
    let start_date_timestamp = new Date(
      new Date(new Date().setDate(current_date)).setHours(0, 0, 0, 0)
    ).getTime();
    let end_time_timestamp = new Date(
      new Date(new Date().setDate(current_date + 1)).setHours(0, 0, 0, 0)
    ).getTime();
    let BLOCK_NB_START_queryParam = {
      module: "block",
      action: "getblocknobytime",
      timestamp: start_date_timestamp / 1000,
      closest: "before",
      apikey: this.eth_tradias_api_key,
    };
    let BLOCK_NB_END_queryParam = {
      module: "block",
      action: "getblocknobytime",
      timestamp: end_time_timestamp / 1000,
      closest: "before",
      apikey: this.eth_tradias_api_key,
    };
    ETH_ERCTOKEN_queryParams["startblock"] = await this.getBlockNb(
      BLOCK_NB_START_queryParam
    );
    ETH_ERCTOKEN_queryParams["endblock"] = await this.getBlockNb(
      BLOCK_NB_END_queryParam
    );
    ETH_INTERNAL_queryParams["startblock"] = await this.getBlockNb(
      BLOCK_NB_START_queryParam
    );
    ETH_INTERNAL_queryParams["endblock"] = await this.getBlockNb(
      BLOCK_NB_END_queryParam
    );
    ETH_NORMAL_queryParams["startblock"] = await this.getBlockNb(
      BLOCK_NB_START_queryParam
    );
    ETH_NORMAL_queryParams["endblock"] = await this.getBlockNb(
      BLOCK_NB_END_queryParam
    );
    return {
      ETH_ERCTOKEN_queryParams,
      ETH_INTERNAL_queryParams,
      ETH_NORMAL_queryParams,
    };
  }
}
module.exports = TanganyParams;