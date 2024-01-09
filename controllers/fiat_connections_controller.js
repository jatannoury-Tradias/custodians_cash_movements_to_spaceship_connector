const ed = require("@noble/ed25519");
let nonce_lib = require("nonce-next");
const BCB = require("../fiat_connections/BCB");
const { BCB_URL } = require("../config/fiat_connections_url");
require("dotenv").config();

class FiatConnectionsController {
  constructor() {
    this.bcb_instance = new BCB();
  }
  async bcb_transactions(from_date = null, to_date = null) {
    let bcb_account_ids = await this.bcb_instance
      .bcb_account_ids_request(BCB_URL, from_date, to_date)
      .then((res) => {
        return res.map((element) => element.id);
      });
    let bcb_transactions = [];
    for (const bcb_account_id of bcb_account_ids) {
      let bcb_account_transactions =
        await this.bcb_instance.bcb_transactions_request(
          BCB_URL,
          bcb_account_id
        );
      bcb_transactions = [...bcb_transactions, ...bcb_account_transactions];
    }
  }
}

// async function custodians_caller() {
//   c = new CustodiansController();
//   let withdrawals = await c.dlt_withdrawals();
//   let deposits = await c.dlt_deposits();
//   console.log();
// }
// if (require.main === module) {
//   custodians_caller();
// }
module.exports = FiatConnectionsController;
