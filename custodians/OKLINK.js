const TanganyParams = require("../config/tangany_params");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");
var logger = require("tracer").console();
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
  async do_oklink_request(currency, method, url, params, page = 1) {
    const request_url = this.json_to_query_params(url, { ...params, page });
    return await fetch(request_url, {
      method,
      headers: {
        "OK-ACCESS-KEY": this.oklink_access_key,
      },
    }).then(async (res) => {
      return await response_parser(
        res,
        200,
        `Oklink ${currency} address ${params.address}`
      );
    });
  }
  async atom_request(
    url,
    from_date = null,
    to_date = null,
    requests_addresses
  ) {
    let all_atom_data = {
      txlist: [],
    };
    url = `${url}/v5/explorer/address/normal-transaction-cosmos?`;
    for (let address of requests_addresses.atom) {
      let page = 0;
      let atom_res = await this.do_oklink_request(
        "ATOM",
        "GET",
        url,
        this.get_atom_params(page, address)
      );
      all_atom_data.txlist = [
        ...(atom_res?.data?.transactionLists ||
          atom_res?.data?.transactionList ||
          []),
        ...all_atom_data.txlist,
      ];
      // Pagination
      while (
        all_atom_data.txlist.length > 0 &&
        !this.date_is_earlier_than_from_date(
          all_atom_data.txlist[all_atom_data.txlist.length - 1].transactionTime,
          from_date
        )
      ) {
        page = parseInt(atom_res["data"]["page"]) + 1;
        atom_res = await this.do_oklink_request(
          "ATOM",
          "GET",
          url,
          this.get_atom_params(page, address),
          page
        );
        all_atom_data.txlist = [
          ...(atom_res?.data?.transactionLists || []),
          ...all_atom_data.txlist,
        ];
      }
      await sleep(this.mapped_timeouts.atom);
    }
    return all_atom_data.txlist.filter((element) =>
      this.date_is_between_input_dates(
        element.transactionTime,
        from_date,
        to_date
      )
    );
  }
  async paginate_oklink(from_date, to_date, txs_url, oklink_params, currency) {
    let txs_request = await this.do_oklink_request(
      currency,
      "GET",
      txs_url,
      oklink_params
    );
    let all_cash_mvts = [
      ...(txs_request.data[0]?.transactionList ||
        txs_request.data[0]?.transactionLists ||
        []),
    ];
    let oldest_cash_mvt =
      all_cash_mvts[all_cash_mvts.length - 1]?.transactionTime;
    if (!oldest_cash_mvt) {
      return [];
    }
    while (!this.date_is_earlier_than_from_date(oldest_cash_mvt, from_date)) {
      try {
        oldest_cash_mvt = new Date(
          parseInt(all_cash_mvts[all_cash_mvts?.length - 1]["transactionTime"])
        );
      } catch (error) {
        if (all_cash_mvts.length === 0) {
          break;
        }
      }
      if (!this.date_is_earlier_than_from_date(oldest_cash_mvt, from_date)) {
        break;
      } else {
        txs_request = await this.do_oklink_request(
          currency,
          "GET",
          txs_url,
          oklink_params,
          parseInt(txs_request.data[0]?.page) + 1
        );
        all_cash_mvts = [
          ...all_cash_mvts,
          ...(txs_request.data[0]?.transactionList ||
            txs_request.data[0]?.transactionLists ||
            []),
        ];
      }
    }

    all_cash_mvts = all_cash_mvts.filter((element) => {
      return !this.date_is_between_input_dates(
        parseInt(element["transactionTime"]),
        from_date,
        to_date
      );
    });
    return all_cash_mvts;
  }

  get_oklink_variables(url, oklink_currencies) {
    let txs_url = `${url}/v5/explorer/address/transaction-list?`;
    let token_txs_url = `${url}/v5/explorer/address/token-transaction-list?`;
    let oklink_data = Array.from(oklink_currencies).reduce(
      (result, element) => {
        result[element] = {};
        result[element].tokentx = [];
        result[element].txlist = [];
        return result;
      },
      {}
    );

    return { txs_url, token_txs_url, oklink_data };
  }
  async oklink_request(
    url,
    from_date = null,
    to_date = null,
    requests_addresses
  ) {
    const currencies = Object.keys(requests_addresses)
      .map((element) => element.replace("oklink_", ""))
      .filter((element) => element !== "undefined");
    let oklink_currencies = new Set(
      this.csv_configs
        .filter((config) => config.Custodian.toLowerCase().includes("oklink"))
        .map((config) => config.Endpoint.toLowerCase().replace("oklink_", ""))
    );
    const { txs_url, token_txs_url, oklink_data } = this.get_oklink_variables(
      url,
      oklink_currencies
    );
    for (let currency of oklink_currencies) {
      if (!Object.keys(requests_addresses).includes(currency)) {
        logger.warn(
          `Currency ${currency} doesn't have a configured address in spaceship`
        );
        continue;
      }
      for (const address of requests_addresses[currency.toLowerCase()]) {
        logger.info(`Requesting Oklink ${currency}`);
        const oklink_params = this.get_oklink_params(currency, address);
        if (!["btc", "doge"].includes(currency)) {
          oklink_data[currency].tokentx = [
            ...(oklink_data[currency]?.tokentx || []),
            ...(await this.paginate_oklink(
              from_date,
              to_date,
              token_txs_url,
              oklink_params,
              currency
            )),
          ];
        }
        oklink_data[currency].txlist = [
          ...(oklink_data[currency]?.txlist || []),
          ...(await this.paginate_oklink(
            from_date,
            to_date,
            txs_url,
            oklink_params,
            currency
          )),
        ];
        await sleep(this.mapped_timeouts[currency]);
      }
    }

    return oklink_data;
  }
}
module.exports = OKLINK;
