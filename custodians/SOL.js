const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
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
    return await fetch(request_url).then(async (res) => await res.json());
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
  async sol_request(url, from_date, to_date) {
    url = `${url}/${this.sol_tradias_address}`;
    const { start_date_timestamp, end_time_timestamp } =
      get_curr_day_to_curr_plus_one_midnight_date(from_date);
    return {
      transfers: await this.sol_transfers(
        url,
        start_date_timestamp,
        end_time_timestamp
      ),
      transactions: await this.sol_transactions(
        url,
        start_date_timestamp,
        end_time_timestamp
      ),
    };
  }
}
module.exports = SOL;
