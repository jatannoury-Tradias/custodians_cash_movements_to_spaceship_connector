const CustodianResponseParser = require("../helpers/custodians_response_parser");
const CustodiansController = require("./custodians_controller");
const FiatConnectionsController = require("./fiat_connections_controller");
const SpaceshipController = require("./spaceship_controller");
const custodian_data = require("../data/test_data/custodians_data");
const { client_deposit } = require("../utils/client_deposit");
class FlowController extends CustodianResponseParser {
  constructor() {
    super();
    this.spaceship_controller = new SpaceshipController();
    this.custodians_controller = new CustodiansController();
    this.fiat_connection_controller = new FiatConnectionsController();
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
    if(this.spaceship_controller.clients_addresses === null){
      await this.spaceship_controller.get_clients_addresses()
    }
    let spaceship_clients = await this.spaceship_controller.get_clients();
    let spaceship_deleted_clients =
      await this.spaceship_controller.get_deleted_clients();
    spaceship_clients = await spaceship_clients.json();
    spaceship_deleted_clients = await spaceship_deleted_clients.json();
    let owner_id_to_name_map = [
      ...spaceship_deleted_clients["items"],
      ...spaceship_clients["items"],
    ].reduce((result, client_object) => {
      let client_id = client_object["id"];
      result[client_id] = client_object["name"];
      return result;
    }, {});

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
  async collect_fiat_data(from_date, to_date) {
    let bcb = await this.fiat_connection_controller.bcb_transactions(
      from_date,
      to_date
    );
    return {
      bcb_transactions,
    };
  }
  async collect_currencies_data(from_date, to_date) {
    let oklink = await this.custodians_controller.oklink_transactions(
      from_date,
      to_date
    );
    oklink = {
      ...oklink,
      ATOM: atom,
    };
    let celo = await this.custodians_controller.celo_transactions(
      from_date,
      to_date
    );
    let xtz = await this.custodians_controller.xtz_transactions(
      from_date,
      to_date
    );
    let etherscan = await this.custodians_controller.eth_transactions(
      from_date,
      to_date
    );

    let dlt_deposits = await this.custodians_controller.dlt_deposits(
      from_date,
      to_date
    );
    let dlt_withdrawals = await this.custodians_controller.dlt_withdrawals(
      from_date,
      to_date
    );
    let dltcustody = {
      deposits: dlt_deposits,
      withdrawals: dlt_withdrawals,
    };
    let eos = await this.custodians_controller.eos_transactions(
      from_date,
      to_date
    );
    // let hbar= await this.custodians_controller.hbar_transactions(
    //   from_date,
    //   to_date
    // );
    let polygon = await this.custodians_controller.polygon_transactions(
      from_date,
      to_date
    );
    let sol = await this.custodians_controller.sol_transactions(
      from_date,
      to_date
    );
    let ftm = await this.custodians_controller.ftm_transactions(
      from_date,
      to_date
    );
    let atom = await this.custodians_controller.atom_transactions(
      from_date,
      to_date
    );
    let near = await this.custodians_controller.near_transactions(
      from_date,
      to_date
    );

    let sgb = await this.custodians_controller.sgb_transactions(
      from_date,
      to_date
    );

    return {
      etherscan,
      dltcustody,
      eos,
      // hbar,
      polygon,
      sol,
      ftm,
      near,
      oklink,
      celo,
      sgb,
      xtz,
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
  async parse_cash_mvt_type(data, config) {
    return data.map((cash_mvt) => {
      let mapped_data = {};
      for (const [config_key, config_value] of Object.entries(config)) {
        if (
          ["custodian", "transaction_key"].includes(config_key.toLowerCase())
        ) {
          continue;
        }
        if (config_key.toLowerCase() === "status_filter") {
          if (this.parse_status_filter(config_value, cash_mvt) === false) {
            return {};
          } else {
            continue;
          }
        }
        mapped_data[config_key] = this.parse_config_value(
          config_value,
          config_key.toLowerCase(),
          cash_mvt,
          mapped_data
        );
      }
      return mapped_data;
    });
  }
  async parse_data(data) {
    let configs = this.parse_csv_config();
    data = data;
    for (const config of configs) {
      let custodian = config.Custodian?.replace("Tangany_", "").toLowerCase();
      // if (!custodian.includes("polygon")) {
      //   continue;
      // }
      let cash_mvt_type = config.Transaction_key.toLowerCase();
      if (Array.isArray(data[custodian])) {
        let custodian_data = data[custodian];
        data[custodian] = { txlist: custodian_data };
      }
      if (custodian.trim() === "" || cash_mvt_type.trim() === "") {
        continue;
      }
      if (!custodian.includes("oklink")) {
        data[custodian][cash_mvt_type] = await this.parse_cash_mvt_type(
          data[custodian][cash_mvt_type],
          config
        );
      } else {
        custodian = custodian.replace("oklink_", "");
        data["oklink"][custodian][cash_mvt_type] =
          await this.parse_cash_mvt_type(
            data["oklink"][custodian][cash_mvt_type],
            config
          );
      }
    }
    let layer_2_filter = await client_deposit(data, this);
  }

  async fiat_connections_to_spaceship_wallets_resolver(
    from_date = null,
    to_date = null
  ) {
    let clients_addresses =
      await this.spaceship_controller.get_clients_addresses(false);
    let collected_fiat_data = await this.collect_fiat_data(from_date, to_date);
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
if (require.main === module) {
  let flow_controller_instance = new FlowController();
  flow_controller_instance.parse_data(custodian_data);
}
