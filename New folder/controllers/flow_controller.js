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
  async get_clients_and_tradias_wallets() {
    if (this.clients_wallets !== null && this.tradias_wallets !== null) {
      return {
        clients_wallets: this.clients_wallets,
        tradias_wallets: this.tradias_wallets,
      };
    }
    const spaceship_clients = await this.spaceship_controller.get_clients();
    let owner_id_to_name_map = await spaceship_clients.json();
    let owner_id_to_label_map = owner_id_to_name_map.reduce(
      (result, client_object) => {
        let client_id = client_object["id"];
        result[client_id] = client_object["label"];
        return result;
      },
      {}
    );
    owner_id_to_name_map = owner_id_to_name_map["items"].reduce(
      (result, client_object) => {
        let client_id = client_object["id"];
        result[client_id] = client_object["name"];
        return result;
      },
      {}
    );

    let tradias_wallets = Object.values(
      this.spaceship_controller.clients_addresses
    )
      .filter((address) => {
        if (
          address["address"] === "0x002ed77009c22e643e6d940c328c36ebd76e0382"
        ) {
          console.log();
        }
        return (
          owner_id_to_name_map[address["owner_id"]] === "Tradias GmbH" 
        );
      })
      .reduce((result, addressObj) => {
        const label = addressObj.address;
        result[label] = addressObj;
        return result;
      }, {});
    const clients_wallets = Object.values(
      this.spaceship_controller.clients_addresses
    )
      .filter((address) => {
        return owner_id_to_name_map[address["owner_id"]] !== "Tradias GmbH";
      })
      .reduce((result, addressObj) => {
        const label = addressObj.address;
        result[label] = addressObj;
        return result;
      }, {});
    return { clients_wallets, tradias_wallets };
  }

  async custodians_cash_mvts_to_spaceship_wallets_resolver() {
    let dlt_deposits = await this.custodians_controller.dlt_deposits();
    let dlt_withdrawals = await this.custodians_controller.dlt_withdrawals();
    await this.spaceship_controller.get_clients_addresses(false);
    const { clients_id_to_withdrawal_mapping, clients_id_to_deposit_mapping } =
      await this.dlt_response_parser(dlt_deposits, dlt_withdrawals);
    console.log();
  }
  async push_transactions(cash_mvts) {
    await cash_mvts.forEach(async (cash_mvt) => {
      await this.spaceship_controller.post_transaction(cash_mvt);
    });
  }
}
module.exports = FlowController;
