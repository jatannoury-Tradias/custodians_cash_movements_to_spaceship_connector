const FiatParams = require("../config/fiat_connections_params");
const { BCB_URL } = require("../config/fiat_connections_url");
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
    let request_url = this.json_to_query_params(
      `${url}/v3/accounts/${id}/transactions?`,
      this.get_bcb_body()
    );
    return await fetch(request_url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.bcb_data.bcb_token}`,
      },
    }).then(async (res) => {
      let text = await res.text();
      return await res.json();
    });
  }
}
module.exports = BCB;
if (require.main === module) {
  async function initialize() {
    let test = new BCB();
    let account_ids = await test.bcb_account_ids_request(BCB_URL);
    await test.bcb_transactions_request(BCB_URL, account_ids[2].id);
  }
  initialize();
}
