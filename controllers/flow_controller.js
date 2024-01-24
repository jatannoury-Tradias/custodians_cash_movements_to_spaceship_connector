const CustodianResponseParser = require("../helpers/custodians_response_parser");
const CustodiansController = require("./custodians_controller");
const FiatConnectionsController = require("./fiat_connections_controller");
const SpaceshipController = require("./spaceship_controller");
const custodian_data = require("../data/test_data/custodians_data");
const { client_deposit } = require("../utils/client_deposit");
const { filter_data } = require("../utils/filter_data");
var logger = require("tracer").console();

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
    if (this.spaceship_controller.clients_addresses === null) {
      await this.spaceship_controller.get_clients_addresses();
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
        addressObj["owner_name"] = owner_id_to_name_map[addressObj.owner_id];
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
        addressObj["owner_name"] = owner_id_to_name_map[addressObj.owner_id];
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
  async collect_currencies_data(from_date, to_date, requests_addresses) {
    let [
      dlt_deposits,
      dlt_withdrawals,
      celo,
      ksm,
      oklink,
      xtz,
      eos,
      hbar,
      solanafm,
      atom,
      near,
      covalent_sgb,
      etherscan,
    ] = await Promise.all([
      this.custodians_controller.dlt_deposits(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.dlt_withdrawals(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.celo_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.ksm_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.oklink_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.xtz_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.eos_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.hbar_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.sol_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.atom_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.near_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.sgb_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
      this.custodians_controller.eth_transactions(
        from_date,
        to_date,
        requests_addresses
      ),
    ]);
    oklink = {
      ...oklink,
      atom,
    };
    let dltcustody = {
      deposits: dlt_deposits,
      withdrawals: dlt_withdrawals,
    };
    return {
      ksm,
      etherscan,
      dltcustody,
      eos,
      hbar,
      solanafm,
      near,
      oklink,
      celo,
      covalent_sgb,
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
  async parse_cash_mvt_type(
    data,
    config,
    custodian,
    clients_wallets,
    tradias_wallets
  ) {
    return data.map((cash_mvt) => {
      let mapped_data = {};
      let extracted_data;
      for (const [config_key, config_value] of Object.entries(config)) {
        if (
          [
            "custodian",
            "transaction_key",
            "endpoint",
            "pagination added",
            "date filter",
            "spacing_timeout",
            "date filter considered",
          ].includes(config_key.toLowerCase().trim())
        ) {
          continue;
        }
        if (config_key.toLowerCase() === "status_filter") {
          if (
            !this.parse_status_filter(
              config_value,
              cash_mvt,
              custodian,
              config_key
            )
          ) {
            return {};
          } else {
            continue;
          }
        }
        if (config_value.toLowerCase().trim() === "from spaceship") {
          extracted_data = this.parse_config_value_from_spaceship(
            config_value,
            config_key,
            cash_mvt,
            mapped_data,
            tradias_wallets,
            clients_wallets,
            `${config.Custodian} - ${config.Endpoint} - ${config.Transaction_key}`
          );
        } else {
          extracted_data = this.parse_config_value(
            config_value,
            config_key.toLowerCase(),
            cash_mvt,
            mapped_data
          );
        }

        if (
          (!extracted_data && extracted_data !== 0) ||
          extracted_data === Infinity
        ) {
          logger.warn(
            `PARSE: Couldn't extract data for config_key of ${config_key} having config_value of ${config_value} for custodian ${custodian}`
          );
          return {};
        }
        mapped_data[config_key] = extracted_data;
      }
      return mapped_data;
    });
  }
  async parse_data(data, clients_wallets, tradias_wallets) {
    let configs = this.parse_csv_config();
    data = data;
    for (const config of configs) {
      let custodian = config.Endpoint?.replace("Tangany_", "").toLowerCase();
      let cash_mvt_type = config.Transaction_key.toLowerCase();
      if (Array.isArray(data[custodian])) {
        let custodian_data = data[custodian];
        data[custodian] = { txlist: custodian_data };
      }
      if (custodian.trim() === "" || cash_mvt_type.trim() === "") {
        continue;
      }
      logger.debug(`Parsing ${custodian}'s ${cash_mvt_type}`);
      if (!custodian.includes("oklink")) {
        if (!Object.keys(data).includes(custodian)) {
          logger.error(
            `PARSE: ${custodian} not included in fetched data: ${Object.keys(
              data
            )}`
          );
          continue;
        } else if (!Object.keys(data[custodian]).includes(cash_mvt_type)) {
          logger.error(
            `PARSE: ${cash_mvt_type} cash_mvt_type not included in ${custodian} fetched data`
          );
          continue;
        }
        try {
          let parsed_data = await this.parse_cash_mvt_type(
            data[custodian][cash_mvt_type],
            config,
            custodian,
            clients_wallets,
            tradias_wallets
          );
          data[custodian][cash_mvt_type] = parsed_data.filter(
            (element) => Object.keys(element).length !== 0
          );
        } catch (error) {
          logger.error(
            `PARSE: Something went wrong while parsing ${custodian}'s ${cash_mvt_type}`
          );
          logger.error(`PARSE: Error that occured:${error}`);
          data[custodian][cash_mvt_type] = [];
        }
      } else {
        custodian = custodian.replace("oklink_", "");
        try {
          if (Array.isArray(data["oklink"][custodian])) {
            let custodian_data = data["oklink"][custodian];
            data["oklink"][custodian] = { txlist: custodian_data };
          }
          let parsed_data = await this.parse_cash_mvt_type(
            data["oklink"][custodian][cash_mvt_type],
            config,
            custodian,
            clients_wallets,
            tradias_wallets
          );
          data["oklink"][custodian][cash_mvt_type] = parsed_data?.filter(
            (element) => Object.keys(element).length > 0
          );
        } catch (error) {
          logger.error(
            `PARSE: Something went wrong while parsing ${custodian}'s ${cash_mvt_type}`
          );
          logger.error(`PARSE: Error that occured:${error}`);
          data["oklink"][custodian][cash_mvt_type] = [];
        }
      }
    }
    await client_deposit(data, this, clients_wallets, tradias_wallets);
    return await filter_data(
      data,
      clients_wallets,
      tradias_wallets,
      from_date,
      to_date
    );
  }

  async fiat_connections_to_spaceship_wallets_resolver(
    from_date = null,
    to_date = null
  ) {
    let clients_addresses =
      await this.spaceship_controller.get_clients_addresses(false);
    let collected_fiat_data = await this.collect_fiat_data(from_date, to_date);
  }

  async push_transactions(parsed_data, addresses_mappings) {
    parsed_data = parsed_data.slice(0, 1);
    for (let cash_mvt of parsed_data) {
      await this.spaceship_controller.post_transaction(
        cash_mvt,
        addresses_mappings
      );
    }
  }
}
module.exports = FlowController;
if (require.main === module) {
  async function initialize() {
    try {
      let flow_controller = new FlowController();
      const { clients_wallets, tradias_wallets } =
        await flow_controller.wallets_to_lower_case(
          await flow_controller.get_clients_and_tradias_wallets()
        );

      let flow_controller_instance = new FlowController();
      await flow_controller_instance.parse_data(
        custodian_data,
        clients_wallets,
        tradias_wallets
      );
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }
  initialize();
}
