const FiatParams = require("../config/fiat_connections_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const sleep = require("../utils/sleep");
require("dotenv").config();

class BCB extends FiatParams {
  constructor() {
    super();
  }

  async bcb_account_ids_request(url, from_date, to_date) {
    return await fetch(`${url}/v3/accounts`, {
      headers: {
        Authorization: `Bearer ${this.bcb_data.bcb_token}`,
      },
    }).then(async (res) => await res.json());
  }
  async bcb_transactions_request(url, id, from_date, to_date) {
    return await fetch(`${url}/v3/accounts/${id}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.bcb_data.bcb_token}`,
      },
      body: JSON.stringify(this.get_bcb_body()),
    }).then(async (res) => await res.json());
  }
}
module.exports = BCB;
