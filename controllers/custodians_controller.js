var logger = require("tracer").console();

const CustodiansInputsParser = require("../helpers/custodians_inputs_parsers");
const {
  ETHERSCAN_URL,
  EOS_URL,
  HBAR_URL,
  SOL_URL,
  POLYGON_URL,
  FTM_URL,
  KSM_URL,
  OKLINK_URL,
  NEAR_URL,
  CELO_URL,
  SGB_URL,
  XTZ_URL,
} = require("../config/tangany_urls");
require("dotenv").config();

class CustodiansController extends CustodiansInputsParser {
  constructor() {
    super();
  }

  async dlt_deposits(from_date = null, to_date = null) {
    logger.info("Collecting dlt_deposits");
    const response = await this.make_dlt_api_request(
      "deposits",
      from_date,
      to_date
    );
    return response;
  }
  async dlt_withdrawals(from_date = null, to_date = null) {
    logger.info("Collecting dlt_withdrawals");
    return await this.make_dlt_api_request("withdrawals", from_date, to_date);
  }
  async eth_transactions(from_date = null, to_date = null) {
    logger.info("Collecting eth_transactions");
    return await this.make_tangany_api_request(
      ETHERSCAN_URL,
      from_date,
      to_date,
      "ETH"
    );
  }
  async eos_transactions(from_date = null, to_date = null) {
    logger.info("Collecting eos_transactions");
    return await this.make_tangany_api_request(
      EOS_URL,
      from_date,
      to_date,
      "EOS"
    );
  }
  async hbar_transactions(from_date = null, to_date = null) {
    logger.info("Collecting hbar_transactions");
    return await this.make_tangany_api_request(
      HBAR_URL,
      from_date,
      to_date,
      "HBAR"
    );
  }

  async polygon_transactions(from_date = null, to_date = null) {
    logger.info("Collecting polygon_transactions");
    return await this.make_tangany_api_request(
      POLYGON_URL,
      from_date,
      to_date,
      "POLYGON"
    );
  }

  async sol_transactions(from_date = null, to_date = null) {
    logger.info("Collecting sol_transactions");
    return await this.make_tangany_api_request(
      SOL_URL,
      from_date,
      to_date,
      "SOL"
    );
  }
  async ftm_transactions(from_date = null, to_date = null) {
    logger.info("Collecting ftm_transactions");
    return await this.make_tangany_api_request(
      FTM_URL,
      from_date,
      to_date,
      "FTM"
    );
  }
  async ksm_transactions(from_date = null, to_date = null) {
    logger.info("Collecting ksm_transactions");
    return await this.make_tangany_api_request(
      KSM_URL,
      from_date,
      to_date,
      "KSM"
    );
  }
  async atom_transactions(from_date = null, to_date = null) {
    logger.info("Collecting atom_transactions");
    return await this.make_tangany_api_request(
      OKLINK_URL,
      from_date,
      to_date,
      "ATOM"
    );
  }
  async oklink_transactions(from_date = null, to_date = null) {
    logger.info("Collecting oklink_transactions");
    return await this.make_tangany_api_request(
      OKLINK_URL,
      from_date,
      to_date,
      "OKLINK"
    );
  }
  async celo_transactions(from_date = null, to_date = null) {
    logger.info("Collecting celo_transactions");
    return await this.make_tangany_api_request(
      CELO_URL,
      from_date,
      to_date,
      "CELO"
    );
  }
  async near_transactions(from_date = null, to_date = null) {
    logger.info("Collecting near_transactions");
    return await this.make_tangany_api_request(
      NEAR_URL,
      from_date,
      to_date,
      "NEAR"
    );
  }
  async sgb_transactions(from_date = null, to_date = null) {
    logger.info("Collecting sgb_transactions");
    return await this.make_tangany_api_request(
      SGB_URL,
      from_date,
      to_date,
      "SGB"
    );
  }
  async xtz_transactions(from_date = null, to_date = null) {
    logger.info("Collecting xtz_transactions");
    return await this.make_tangany_api_request(
      XTZ_URL,
      from_date,
      to_date,
      "XTZ"
    );
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
module.exports = CustodiansController;
