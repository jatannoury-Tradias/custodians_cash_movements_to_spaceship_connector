class TanganyParams {
  constructor() {}
  async getBlockNb(block_number_query_param) {
    let url = "https://api.etherscan.io/api?";
    Object.keys(block_number_query_param).forEach((key) => {
      url += `${key}=${block_number_query_param[key]}&`;
    });
    const response = await fetch(url).then((res) => {
      return res.json();
    });

    return response["result"];
  }
  async get_eth_params() {
    var ETH_NORMAL_queryParams = {
      module: "account",
      action: "txlist",
      address: "0xE2BFb378DaefB66C19502B715bDC599304ddBd2A",
      apikey: "GCZG8VB73B4NFKDC9EGZP1V75H8MU9K4B6",
    };
    var ETH_INTERNAL_queryParams = {
      module: "account",
      action: "txlistinternal",
      address: "0xE2BFb378DaefB66C19502B715bDC599304ddBd2A",
      apikey: "GCZG8VB73B4NFKDC9EGZP1V75H8MU9K4B6",
    };

    var ETH_ERCTOKEN_queryParams = {
      module: "account",
      action: "tokentx",
      address: "0xE2BFb378DaefB66C19502B715bDC599304ddBd2A",
      apikey: "GCZG8VB73B4NFKDC9EGZP1V75H8MU9K4B6",
    };
    let current_date = new Date().getDate() - 1;
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
      apikey: "GCZG8VB73B4NFKDC9EGZP1V75H8MU9K4B6",
    };
    let BLOCK_NB_END_queryParam = {
      module: "block",
      action: "getblocknobytime",
      timestamp: end_time_timestamp / 1000,
      closest: "before",
      apikey: "GCZG8VB73B4NFKDC9EGZP1V75H8MU9K4B6",
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
