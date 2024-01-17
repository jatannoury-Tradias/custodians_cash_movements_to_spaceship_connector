const TanganyParams = require("../config/tangany_params");
const { response_parser } = require("../utils/response_parser");
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
      return await response_parser(res, 200, `Oklink ${currency}`);
    });
  }
  async atom_request(url, from_date = null, to_date = null) {
    url = `${url}/v5/explorer/address/normal-transaction-cosmos?`;
    let page = 0;
    let atom_res = await this.do_oklink_request(
      "ATOM",
      "GET",
      url,
      this.get_atom_params(page)
    );
    let all_atom_res = [
      ...(atom_res?.data?.transactionLists ||
        atom_res?.data?.transactionList ||
        []),
    ];
    // Pagination
    while (
      all_atom_res.length > 0 &&
      !this.date_is_earlier_than_from_date(
        all_atom_res[all_atom_res.length - 1].transactionTime,
        from_date
      )
    ) {
      page = parseInt(atom_res["data"]["page"]) + 1;
      atom_res = await this.do_oklink_request(
        "ATOM",
        "GET",
        url,
        this.get_atom_params(page),
        page
      );
      all_atom_res = [
        ...(atom_res?.data?.transactionLists || []),
        ...all_atom_res,
      ];
    }
    return {
      txlist: all_atom_res.filter((element) =>
        this.date_is_between_input_dates(
          element.transactionTime,
          from_date,
          to_date
        )
      ),
    };
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
      for (let currency of Object.keys(this.address_mapping[currency_type])) {
        logger.info(`Requesting Oklink ${currency}`);
        const oklink_params = this.get_oklink_params(
          currency,
          this.address_mapping[currency_type]
        );
        let token_txs_data = [];
        if (currency_type !== "special") {
          token_txs_data = await this.paginate_oklink(
            from_date,
            to_date,
            token_txs_url,
            oklink_params,
            currency
          );
        }
        const normal_txs_data = await this.paginate_oklink(
          from_date,
          to_date,
          txs_url,
          oklink_params,
          currency
        );
        if (currency.toLowerCase().includes("matic")) {
          currency = "polygon";
        } else if (currency.toLowerCase().includes("avax")) {
          currency = "avax-c";
        }

        oklink_data[currency] = {
          txlist: normal_txs_data,
          tokentx: token_txs_data,
        };
      }
    }

    return oklink_data;
  }
}
module.exports = OKLINK;
