const TanganyParams = require("../config/tangany_params");
const SpaceshipController = require("../controllers/spaceship_controller");
const CashMvtsMapper = require("../helpers/cahs_mvts_mapper");

class AddressesService {
  constructor() {
    this.spaceship_controller_instance = new SpaceshipController();
    this.cash_mvts_mapper_instance = new CashMvtsMapper();
    this.csv_configs = this.cash_mvts_mapper_instance.parse_csv_config();
  }
  async get_requests_addresses() {
    let all_addresses =
      await this.spaceship_controller_instance.get_all_addresses();
    let owners = await this.spaceship_controller_instance
      .get_clients()
      .then(async (res) => await res.json());
    owners = owners["items"].reduce((result, element) => {
      result[element.id] = element.name;
      return result;
    }, {});
    all_addresses = all_addresses.filter(
      (element) =>
        owners[element.owner_id] === "Tradias GmbH" &&
        element.label.split(" - ").length === 3
    );
    let configs_endpoint_to_currency_mapping = this.csv_configs.reduce(
      (result, element) => {
        const currency_name_from_custodian = element.Custodian.toLowerCase()
          .replace("tangany_", "")
          .replace("oklink_", "");
        result[currency_name_from_custodian] = element.Endpoint.toLowerCase();
        return result;
      },
      {}
    );
    all_addresses = all_addresses.reduce((result, element) => {
      let endpoint_name = element.label
        .split(" - ")
        .slice(-1)[0]
        .toLowerCase();
      if (endpoint_name === "songbird") {
        endpoint_name = "covalent_songbird";
      }
      if (
        Object.keys(result).includes(
          configs_endpoint_to_currency_mapping[endpoint_name]?.replace(
            "oklink_",
            ""
          )
        )
      ) {
        result[
          configs_endpoint_to_currency_mapping[endpoint_name]?.replace(
            "oklink_",
            ""
          )
        ].push(element.address);
      } else {
        result[
          configs_endpoint_to_currency_mapping[endpoint_name]?.replace(
            "oklink_",
            ""
          )
        ] = [element.address];
      }

      return result;
    }, {});
    Object.keys(all_addresses).forEach((element) => {
      all_addresses[element] = [...new Set(all_addresses[element])];
    });
    return all_addresses;
  }
}

module.exports = {
  AddressesService,
};
