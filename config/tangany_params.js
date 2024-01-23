const CashMvtsMapper = require("../helpers/cahs_mvts_mapper");
const { AddressesService } = require("../utils/address_service");
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
    this.dg_access_key = env.DG_ACCESS_KEY;
    this.eth_tradias_api_key = env.ETH_TRADIAS_API_KEY;
    this.polygon_tradias_api_key = env.POLYGON_ACCESS_KEY;
    this.celo_tradias_api_key = env.CELO_TRADIAS_API_KEY;
    this.ftm_tradias_api_key = env.FTM_ACCESS_KEY;
    this.ksm_tradias_api_key = env.KSM_ACCESS_KEY;
    this.sgb_tradias_api_key = env.SGB_ACCESS_KEY;
    this.address_service_instance = new AddressesService();
    this.cash_mvts_mapper_instance = new CashMvtsMapper();
    this.csv_configs = this.cash_mvts_mapper_instance.parse_csv_config();
    this.mapped_timeouts = this.csv_configs.reduce((result, element) => {
      let current_timeout = parseInt(element.Spacing_Timeout);
      result[element.Endpoint.toLowerCase().replace("oklink_", "")] = isNaN(
        current_timeout
      )
        ? 0
        : current_timeout;
      return result;
    }, {});
  }

  date_is_earlier_than_from_date(input_date, from_date) {
    const is_decimal_regex = /^\d+$/;
    if (
      !Number.isInteger(input_date) &&
      !(input_date instanceof Date) &&
      input_date.endsWith("Z")
    ) {
      input_date = input_date.slice(0, -1);
    }
    if (!from_date || !input_date) {
      return !this.date_is_earlier_than_today(input_date);
    }
    let date_object;
    if (!(input_date instanceof Date)) {
      if (Number.isInteger(input_date) || is_decimal_regex.test(input_date)) {
        date_object = new Date(parseInt(input_date));
      } else {
        date_object = new Date(input_date);
      }
    } else {
      date_object = input_date;
    }
    return date_object < new Date(from_date);
  }
  date_is_between_input_dates(input_date, from_date, to_date) {
    const is_decimal_regex = /^\d+$/;
    if (
      !Number.isInteger(input_date) &&
      typeof input_date !== "number" &&
      input_date.endsWith("Z")
    ) {
      input_date = input_date.slice(0, -1);
    }
    if (!from_date || !to_date || !input_date) {
      return !this.date_is_earlier_than_today(input_date);
    }
    let date_object;
    if (!(input_date instanceof Date)) {
      if (Number.isInteger(input_date) || is_decimal_regex.test(input_date)) {
        date_object = new Date(
          parseInt(input_date) * 10 ** (13 - input_date.length)
        );
      } else {
        date_object = new Date(input_date);
      }
    } else {
      date_object = input_date;
    }
    return date_object < new Date(to_date) && date_object > new Date(from_date);
  }
  date_is_earlier_than_today(cash_mvt_block_time) {
    // Create a new Date object in UTC using the values from the original date
    let originalDate = new Date(cash_mvt_block_time);
    if (!cash_mvt_block_time) {
      return true;
    }
    // Adjust for the local time zone offset
    let localOffset = originalDate.getTimezoneOffset();
    let blockTime = new Date(originalDate.getTime() + localOffset * 60 * 1000);
    let currentDate = new Date();
    currentDate = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        currentDate.getUTCHours(),
        currentDate.getUTCMinutes(),
        currentDate.getUTCSeconds(),
        currentDate.getUTCMilliseconds()
      )
    );
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
  get_hbar_params(from_date = null, to_date, address) {
    if (!from_date || !to_date) {
      const { start_date_timestamp, end_time_timestamp } =
        get_curr_day_to_curr_plus_one_midnight_date(from_date);
      return {
        consensusStartInEpoch: start_date_timestamp,
        consensusEndInEpoch: end_time_timestamp,
      };
    }
    return {
      consensusStartInEpoch: new Date(from_date).getTime(),
      consensusEndInEpoch: new Date(to_date).getTime(),
    };
  }
  get_sgb_params(page) {
    return {
      "page-number": page,
      "page-size": 1000,
      key: this.sgb_tradias_api_key,
    };
  }
  get_ftm_params(from, action) {
    const offset = from + 100;
    return this.ftm_tradias_wallet.split(",").map((address) => ({
      module: "account",
      action: action,
      address: address.trim(), // Assuming addresses may have leading/trailing spaces
      startblock: 0,
      endblock: 99999999,
      page: from !== 0 ? from : 1,
      offset: offset,
      sort: "desc",
      apikey: this.ftm_tradias_api_key,
    }));
  }
  get_polygon_params(page, action) {
    return this.polygon_tradias_wallet.split(",").map((address) => ({
      module: "account",
      action: action,
      address: address.trim(), // Assuming addresses may have leading/trailing spaces
      startblock: 0,
      endblock: 999999999999,
      page: page !== 0 ? page : 1,
      offset: 500,
      sort: "desc",
      apikey: this.polygon_tradias_api_key,
    }));
  }
  async get_celo_block_nb(date) {
    return await fetch(
      `https://api.celoscan.io/api?module=block&action=getblocknobytime&timestamp=${
        new Date(date).getTime() / 1000
      }&closest=before&apikey=${this.celo_tradias_api_key}`
    ).then(async (res) => {
      let json_res = await res.json();
      return isNaN(parseInt(json_res.result)) ? 0 : parseInt(json_res.result);
    });
  }
  async get_celo_params(action, from_date, to_date, address) {
    return {
      module: "account",
      action: action,
      address: address.trim(), // Assuming addresses may have leading/trailing spaces
      startblock: await this.get_celo_block_nb(from_date),
      endblock: await this.get_celo_block_nb(to_date),
      page: 0,
      offset: 10000,
      sort: "desc",
      apikey: this.celo_tradias_api_key,
    };
  }
  get_xtz_params(lastId = null) {
    let params = {
      limit: 1000,
      type: "transaction",
    };
    if (lastId) {
      params["lastId"] = lastId;
    }
    return params;
  }
  get_eos_params(pos = null, address) {
    return {
      account_name: address,
      pos: pos === null ? -1 : pos,
      offset: -100,
    };
  }
  get_atom_params(page = null, address, offset = null) {
    return {
      address: address,
      chainShortName: "cosmos",
      page,
      limit: 50,
    };
  }
  get_oklink_params(currency, address) {
    let chainShortName = currency.toLowerCase();
    let symbol = currency.toUpperCase();
    if (currency === "avax-c") {
      chainShortName = "avaxc";
      symbol = "AVAXC";
    } else if (currency === "arb") {
      chainShortName = "arbitrum";
    } else if (address === undefined) {
      throw new Error(`ADDRESS OF ${currency} NOT FOUND IN SPACESHIP`);
    }
    return {
      chainShortName,
      address,
      symbol,
      limit: 50,
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
  async get_eth_params(address, from_date = null, to_date = null) {
    var ETH_NORMAL_queryParams = {
      module: "account",
      action: "txlist",
      address: address,
      apikey: this.eth_tradias_api_key,
    };
    var ETH_INTERNAL_queryParams = {
      module: "account",
      action: "txlistinternal",
      address: address,
      apikey: this.eth_tradias_api_key,
    };

    var ETH_ERCTOKEN_queryParams = {
      module: "account",
      action: "tokentx",
      address: address,
      apikey: this.eth_tradias_api_key,
    };
    let current_date =
      from_date === null
        ? new Date().getDate() - 1
        : new Date(from_date).getDate();
    let start_date_timestamp = !from_date
      ? new Date(
          new Date(new Date().setDate(current_date)).setHours(0, 0, 0, 0)
        ).getTime()
      : new Date(from_date).getTime();
    let end_time_timestamp = !to_date
      ? new Date(
          new Date(new Date().setDate(current_date + 1)).setHours(0, 0, 0, 0)
        ).getTime()
      : new Date(to_date).getTime();
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
