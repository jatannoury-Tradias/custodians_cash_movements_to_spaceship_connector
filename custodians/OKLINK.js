const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");
require("dotenv").config();

class OKLINK extends TanganyParams {
  constructor() {
    super();
    this.env = process.env;
    this.address_mapping = { normal: {}, special: {} };
    this.oklink_access_key = this.env.OKLINK_ACCESS_KEY;

    this.process_dotenv_addresses();
  }
  process_dotenv_addresses() {
    this.env.OKLINK_NORMAL_CURRENCIES.split(",").forEach((currency) => {
      if (currency === "AVAX-C") {
        currency = "AVAX";
      }
      this.address_mapping["normal"][currency] =
        this.env[`${currency}_ACCOUNT_ADDRESS`];
    });
    this.env.OKLINK_SPECIAL_CURRENCIES.split(",").forEach((currency) => {
      this.address_mapping["special"][currency] =
        this.env[`${currency}_ACCOUNT_ADDRESS`];
    });
  }
  async do_oklink_request(method, url, params, page = 1) {
    const request_url = this.json_to_query_params(url, { ...params, page });
    return await fetch(request_url, {
      method,
      headers: {
        "OK-ACCESS-KEY": this.oklink_access_key,
      },
    }).then(async (res) => await res.json());
  }
  async atom_request(url, from_date = null, to_date = null) {
    url = `${url}/v5/explorer/address/normal-transaction-cosmos?`;
    let atom_res = await this.do_oklink_request(
      "GET",
      url,
      this.get_atom_params(page)
    );
    let all_atom_res = [...(atom_res?.data?.transactionLists || [])];
    // Pagination
    while (atom_res["data"]["page"] !== atom_res["data"]["totalPage"]) {
      atom_res = await this.do_oklink_request(
        "GET",
        url,
        this.get_atom_params(page),
        parseInt(atom_res["data"]["page"]) + 1
      );
      all_atom_res = [
        ...(atom_res?.data?.transactionLists || []),
        ...all_atom_res,
      ];
      console.log("first");
    }
    return all_atom_res;
  }
  async paginate_oklink(txs_url, oklink_params) {
    let txs_request = await this.do_oklink_request(
      "GET",
      txs_url,
      oklink_params
    );
    let all_cash_mvts = [];
    let oldest_cash_mvt;
    while (txs_request.data[0]?.totalPage !== txs_request.data[0]?.page) {
      all_cash_mvts = [
        ...all_cash_mvts,
        ...(txs_request.data[0]?.transactionList ||
          txs_request.data[0]?.transactionLists ||
          []),
      ];

      try {
        oldest_cash_mvt = new Date(
          parseInt(all_cash_mvts[all_cash_mvts?.length - 1]["transactionTime"])
        );
      } catch (error) {
        if (all_cash_mvts.length === 0) {
          break;
        }
        console.log("first");
      }
      if (this.date_is_earlier_than_today(oldest_cash_mvt)) {
        break;
      } else {
        txs_request = await this.do_oklink_request(
          "GET",
          txs_url,
          oklink_params,
          parseInt(txs_request.data[0]?.page) + 1
        );
      }
    }
    all_cash_mvts = all_cash_mvts.filter((element) => {
      return !this.date_is_earlier_than_today(
        parseInt(element["transactionTime"])
      );
    });
    return all_cash_mvts;
  }

  get_oklink_variables(url) {
    let txs_url = `${url}/v5/explorer/address/transaction-list?`;
    let token_txs_url = `${url}/v5/explorer/address/token-transaction-list?`;
    let oklink_data = {};
    return { txs_url, token_txs_url, oklink_data };
  }
  async oklink_request(url, from_date = null, to_date = null) {
    const { txs_url, token_txs_url, oklink_data } =
      this.get_oklink_variables(url);
    for (const currency_type of Object.keys(this.address_mapping)) {
      for (const currency of Object.keys(this.address_mapping[currency_type])) {
        const oklink_params = this.get_oklink_params(
          currency,
          this.address_mapping[currency_type]
        );
        const normal_txs_data = await this.paginate_oklink(
          txs_url,
          oklink_params
        );
        let token_txs_data = [];
        if (currency_type !== "special") {
          let token_txs_data = await this.paginate_oklink(
            token_txs_url,
            oklink_params
          );
        }
        oklink_data[currency.toUpperCase()] = {
          normal_txs_data,
          token_txs_data,
        };
      }
    }
    
    return oklink_data
  }
}
module.exports = OKLINK;
