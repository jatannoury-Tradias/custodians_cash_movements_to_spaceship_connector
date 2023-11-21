const CustodianResponseParser = require("../helpers/custodians_response_parser");
const CustodiansController = require("./custodians_controller");
const SpaceshipController = require("./spaceship_controller");

class FlowController extends CustodianResponseParser {
  constructor() {
    super();
    this.spaceship_controller = new SpaceshipController();
    this.custodians_controller = new CustodiansController();
    this.customer_id_to_custodian_cash_mvts_mapper = {};
    this.wallets_with_no_spaceship_mapping = [];
    this.tradias_wallets = null;
    this.clients_wallets = null;
  }
  get_clients_and_tradias_wallets() {
    if (this.clients_wallets !== null && this.tradias_wallets !== null) {
      return {
        clients_wallets: this.clients_wallets,
        tradias_wallets: this.tradias_wallets,
      };
    }
    let tradias_wallets = Object.values(
      this.spaceship_controller.clients_addresses
    )
      .filter((address) => address["label"].toLowerCase().includes("- pool"))
      .reduce((result, addressObj) => {
        const label = addressObj.address;
        result[label] = addressObj;
        return result;
      }, {});
    const clients_wallets = Object.values(
      this.spaceship_controller.clients_addresses
    )
      .filter((address) => !address["label"].toLowerCase().includes("- pool"))
      .reduce((result, addressObj) => {
        const label = addressObj.address;
        result[label] = addressObj;
        return result;
      }, {});
    return { clients_wallets, tradias_wallets };
  }

  async custodians_cash_mvts_to_spaceship_wallets_resolver() {
    let dlt_deposits = await this.custodians_controller.dlt_deposits(
      "2023-10-01 00:00:00",
      "2023-11-18 00:00:00"
    );
    let dlt_withdrawals = await this.custodians_controller.dlt_withdrawals(
      "2023-10-01 00:00:00",
      "2023-11-18 00:00:00"
    );
    await this.spaceship_controller.get_clients_addresses(true);
    const { clients_id_to_withdrawal_mapping, clients_id_to_deposit_mapping } =
      this.dlt_response_parser(dlt_deposits, dlt_withdrawals);
    console.log();
  }
}
module.exports = FlowController;
