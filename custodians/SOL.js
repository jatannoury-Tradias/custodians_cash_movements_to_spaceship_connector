const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
  get_curr_day_minus_one_to_curr_day_midnight_date,
} = require("../utils/date_utils");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");
require("dotenv").config();

class SOL extends TanganyParams {
  constructor() {
    super();
  }
  async do_sol_request(
    url,
    cash_mvt_type,
    start_date_timestamp,
    end_time_timestamp
  ) {
    url = `${url}/${cash_mvt_type}?`;
    const request_url = this.json_to_query_params(url, {
      utcFrom: start_date_timestamp,
      utcTo: end_time_timestamp,
    });
    return await fetch(request_url).then(async (res) => {
      return await response_parser(res, 200, "SOL");
    });
  }
  async sol_transfers(url, start_date_timestamp, end_time_timestamp) {
    return await this.do_sol_request(
      url,
      "transfers",
      start_date_timestamp,
      end_time_timestamp
    );
  }
  async sol_transactions(url, start_date_timestamp, end_time_timestamp) {
    return await this.do_sol_request(
      url,
      "transactions",
      start_date_timestamp,
      end_time_timestamp
    );
  }
  async get_account_tokens(url) {
    url = `${url.replace("accounts", "addresses").replace("v0", "v1")}/tokens`;
    return await fetch(url)
      .then(async (res) => {
        const splitted_url = url.split("/");
        return await response_parser(
          res,
          200,
          `SOL Tokens for address ${splitted_url[splitted_url.length - 2]}`
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }
  map_sol_transfers(solTransfers, tokens) {
    try {
      return !solTransfers
        ? []
        : solTransfers
            .flatMap((element) =>
              element.data.map((sub_element) => {
                sub_element["transactionHash"] = element.transactionHash;
                const correlated_token_data =
                  tokens[sub_element.token]?.tokenData;

                if (sub_element.token === "") {
                  sub_element["tokenSymbol"] = "SOL";
                  sub_element["tokenDecimal"] = 9;
                  return sub_element;
                } else if (!correlated_token_data) {
                  return {};
                }

                sub_element["tokenSymbol"] =
                  correlated_token_data.tokenList.symbol;
                sub_element["tokenDecimal"] = correlated_token_data.decimals;
                return sub_element;
              })
            )
            .filter((element) => Object.keys(element).length !== 0);
    } catch (error) {
      console.log("first");
    }
  }
  async sol_request(url, from_date, to_date, requests_addresses) {
    let all_sol_data = {
      tokentx: [],
    };
    for (let address of requests_addresses.solanafm) {
      let start_date_timestamp, end_time_timestamp;
      if (from_date && to_date) {
        start_date_timestamp = new Date(from_date).getTime();
        end_time_timestamp = new Date(to_date).getTime();
      } else {
        ({ start_date_timestamp, end_time_timestamp } =
          get_curr_day_minus_one_to_curr_day_midnight_date(from_date, to_date));
      }

      const account_tokens = await this.get_account_tokens(`${url}/${address}`);
      let sol_transfers = await this.sol_transfers(
        `${url}/${address}`,
        start_date_timestamp / 1000,
        end_time_timestamp / 1000
      );
      all_sol_data.tokentx = [
        ...all_sol_data.tokentx,
        ...(this.map_sol_transfers(
          sol_transfers.results,
          account_tokens.tokens
        ) || []),
      ];
      await sleep(this.mapped_timeouts.solanafm);
    }
    return all_sol_data;
  }
}
module.exports = SOL;
