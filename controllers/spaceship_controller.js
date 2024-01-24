const get_local_data = require("../helpers/get_local_data");

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
  async get_clients() {
    let headers = await this.user_headers();
    let response = await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/clients/?skip=0&limit=1000&show_deleted=false`,
      {
        method: "GET",
        headers: headers,
      }
    );
    return response;
  }
  async get_deleted_clients() {
    let headers = await this.user_headers();
    let response = await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/clients/?skip=0&limit=1000&show_deleted=true`,
      {
        method: "GET",
        headers: headers,
      }
    );
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
  async get_all_addresses() {
    let response = await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/addresses/?limit=1000`,
      {
        method: "GET",
        headers: await this.user_headers(),
      }
    ).then(async (res) => await res.json());
    let all_responses = response["items"];
    const total_count = response["pagination"]["total_count"];
    while (all_responses.length < total_count) {
      response = await fetch(
        `https://${this.env.toLowerCase()}.tradias.link/api/addresses/?limit=100&skip=${
          all_responses.length
        }`,
        {
          method: "GET",
          headers: await this.user_headers(),
        }
      ).then(async (res) => await res.json());
      all_responses = [...all_responses, ...response["items"]];
    }
    if (all_responses.length > total_count) {
      throw `PARSE: Something went wrong while fetching the addresses since we got ${all_responses.length} addresses while total_count = ${total_count}`;
    }
    return all_responses;
  }
  async get_clients_addresses(return_static_response = false) {
    let response;
    let json_response;
    if (return_static_response) {
      response = await get_local_data("prod_addresses");
    } else {
      response = await fetch(
        `https://${this.env.toLowerCase()}.tradias.link/api/addresses/?limit=1000`,
        {
          method: "GET",
          headers: await this.user_headers(),
        }
      );
    }

    try {
      json_response = await response.json();
    } catch (e) {
      json_response = response;
    }
    await this.get_custodians();
    this.clients_addresses = {};
    for (let item of json_response["items"]) {
      this.clients_addresses[item["address"]] = {
        ...item,
        custodian_id: this.custodians[item["custodian_id"]],
      };
    }

    return json_response;
  }
  async post_transaction(cash_mvt, addresses_mappings) {
    if (!(cash_mvt.executed_at instanceof Date)) {
      cash_mvt.executed_at = new Date(cash_mvt.executed_at);
    }
    let response = await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await this.user_headers()),
        },
        body: JSON.stringify({
          value_date: parseInt(cash_mvt.executed_at.getTime() / 1000),
          sender_address_id: addresses_mappings[cash_mvt.sender_address].id,
          receiver_address_id: addresses_mappings[cash_mvt.recipient_address].id,
          amount: parseFloat(cash_mvt.amount).toString(),
          currency: cash_mvt.currency_code.toUpperCase(),
          reference: cash_mvt.reference,
          reference_type: cash_mvt['reference_type'],
          type: cash_mvt.transaction_type.toUpperCase(),
        }),
      }
    );

    let json_response = await response.json();
    console.log('first')
  }
  async get_custodians(return_json_response = false) {
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
    return return_json_response ? json_response : response;
  }
  async get_supported_currencies() {
    return await fetch(
      `https://${this.env.toLowerCase()}.tradias.link/api/currencies/?limit=1000`,
      {
        method: "GET",
        headers: await this.user_headers(),
      }
    )
      .then(async (res) => await res.json())
      .then((res) => res.items.map((element) => element.currency_code));
  }
}
async function spaceship_addresses_caller() {
  c = new SpaceshipController();
  let data = await c.get_clients_addresses(true);
  console.log(data);
}
if (require.main === module) {
  spaceship_addresses_caller();
}
module.exports = SpaceshipController;
