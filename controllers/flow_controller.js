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
    let spaceship_clients = await this.spaceship_controller.get_clients();
    let spaceship_deleted_clients =
      await this.spaceship_controller.get_deleted_clients();
    spaceship_clients = await spaceship_clients.json();
    spaceship_deleted_clients = await spaceship_deleted_clients.json();
    let owner_id_to_name_map = [
      ...spaceship_deleted_clients["items"],
      ...spaceship_clients["items"],
    ];

    owner_id_to_name_map = owner_id_to_name_map.reduce(
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
        return owner_id_to_name_map[address["owner_id"]] === "Tradias GmbH";
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
  async collect_data(from_date, to_date) {
    // let etherscan_transactions =
    //   await this.custodians_controller.eth_transactions(from_date, to_date);
    // let dlt_deposits = await this.custodians_controller.dlt_deposits(
    //   from_date,
    //   to_date
    // );
    // let dlt_withdrawals = await this.custodians_controller.dlt_withdrawals(
    //   from_date,
    //   to_date
    // );
    // let eos_transactions = await this.custodians_controller.eos_transactions(
    //   from_date,
    //   to_date
    // );
    // let hbar_transactions = await this.custodians_controller.hbar_transactions(
    //   from_date,
    //   to_date
    // );
    let polygon_transactions =
      await this.custodians_controller.polygon_transactions(from_date, to_date);
    // let sol_transactions = await this.custodians_controller.sol_transactions(
    //   from_date,
    //   to_date
    // );
    return {
      // etherscan_transactions,
      // dlt_withdrawals,
      // dlt_deposits,
      // eos_transactions,
      // hbar_transactions,
      // sol_transactions,
      polygon_transactions,
    };
  }
  wallets_to_lower_case(data) {
    const { clients_wallets, tradias_wallets } = data;
    Object.keys(clients_wallets).map((key) => {
      let data = clients_wallets[key];
      delete clients_wallets[key];
      clients_wallets[key.toLowerCase()] = data;
    });
    Object.keys(tradias_wallets).map((key) => {
      let data = tradias_wallets[key];
      delete tradias_wallets[key];
      tradias_wallets[key.toLowerCase()] = data;
    });
    return {
      clients_wallets,
      tradias_wallets,
    };
  }
  async parse_data(data, clients_addresses) {
    const {
      // etherscan_transactions,
      // dlt_withdrawals,
      // dlt_deposits,
      // eos_transactions,
      // hbar_transactions,
      // sol_transactions,
      polygon_transactions,
    } = data;
    console.log();

    const { clients_wallets, tradias_wallets } = this.wallets_to_lower_case(
      await this.get_clients_and_tradias_wallets()
    );
    await this.polygon_response_parser(
      polygon_transactions,
      clients_wallets,
      tradias_wallets
    );
    // await this.hbar_response_parser(
    //   hbar_transactions,
    //   clients_wallets,
    //   tradias_wallets
    // );
    // await this.eos_response_parser(
    //   eos_transactions,
    //   clients_wallets,
    //   tradias_wallets
    // );
    // const { clients_id_to_withdrawal_mapping, clients_id_to_deposit_mapping } =
    //   await this.dlt_response_parser(dlt_deposits, dlt_withdrawals);
    // await this.etherscan_response_parser(
    //   etherscan_transactions,
    //   clients_wallets,
    //   tradias_wallets
    // );
  }
  async custodians_cash_mvts_to_spaceship_wallets_resolver(
    from_date = null,
    to_date = null
  ) {
    let clients_addresses =
      await this.spaceship_controller.get_clients_addresses(false);
    let collected_data = await this.collect_data(from_date, to_date);
    await this.parse_data(collected_data, clients_addresses);
  }
  async push_transactions(flow_controller_instance) {
    Object.keys(flow_controller_instance).forEach(async (element) => {
      await flow_controller_instance[element].forEach(async (cash_mvt) => {
        await this.spaceship_controller.post_transaction(cash_mvt);
      });
    });
  }
}
   module.exports = FlowController;
