require("dotenv").config();

const env = process.env;

class SpaceshipController {
  constructor() {
    this.spaceship_email = env.SPACESHIP_USERNAME;
    this.spaceship_password = env.SPACESHIP_PASSWORD;
    this.env = env.ENV;
    this.user_token = null;
    this.clients_addresses = null;
    this.custodians = null;
  }
  async get_user_token() {
    let response = await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/authenticate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: this.spaceship_email,
          secret: this.spaceship_password,
        }),
      }
    );

    let json_response = await response.json();
    this.user_token = json_response["auth_token"];
    return response;
  }
  async user_headers() {
    if (this.user_token === null) {
      await this.get_user_token();
    }
    return {
      Authorization: `Bearer ${this.user_token}`,
    };
  }
  async get_clients_addresses() {
    let response = await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/addresses/`,
      {
        method: "GET",
        headers: await this.user_headers(),
      }
    );

    let json_response = await response.json();
    await this.get_custodians();
    this.clients_addresses = {};
    for (let item of json_response["items"]) {
      this.clients_addresses[item["address"]] = {
        ...item,
        custodian_id: this.custodians[item["custodian_id"]],
      };
    }

    return response;
  }
  async get_custodians() {
    let response = await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/counter_parties/names?show_deleted=false&types=CUSTODIAN`,
      {
        method: "GET",
        headers: await this.user_headers(),
      }
    );
    this.custodians = {};
    let json_response = await response.json();
    for (let item of json_response["items"]) {
      this.custodians[item["id"]] = item["name"];
    }
    return response;
  }
}
let c = new SpaceshipController();
c.get_clients_addresses();
