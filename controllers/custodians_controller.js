const ed = require("@noble/ed25519");
// const fetch = require("node-fetch");
let nonce_lib = require("nonce-next");
const CustodiansInputsParser = require("../helpers/custodians_inputs_parsers");
require("dotenv").config();

class CustodiansController extends CustodiansInputsParser {
  constructor() {
    super();
  }

  async dlt_deposits(from_date = null, to_date = null) {
    return await this.make_dlt_api_request("deposits", from_date, to_date);
  }
  async dlt_withdrawals(from_date = null, to_date = null) {
    return await this.make_dlt_api_request("withdrawals", from_date, to_date);
  }
}
async function custodians_caller() {
  c = new CustodiansController();
  let withdrawals = await c.dlt_withdrawals();
  let deposits = await c.dlt_deposits();
  console.log();
}
if (require.main === module) {
  custodians_caller();
}
module.exports = CustodiansController
