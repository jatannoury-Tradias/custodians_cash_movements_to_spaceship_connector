const SpaceshipController = require("../controllers/spaceship_controller");

class AddressesService {
  constructor() {
    this.spaceship_controller_instance = new SpaceshipController();
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
    return all_addresses.reduce((result, element) => {
      const endpoint_name = element.label.split(" - ").slice(-1)[0].toLowerCase();
      if (Object.keys(result).includes(endpoint_name)) {
        result[endpoint_name].push(element.address);
      } else {
        result[endpoint_name] = [element.address];
      }

      return result;
    }, {});
  }
}

module.exports = {
  AddressesService,
};
