const CashMvtsMapper = require("./cahs_mvts_mapper");

class CustodianResponseParser extends CashMvtsMapper {
  constructor() {
    super();
    this.clients_deposits = [];
    this.clients_withdrawals = [];
    this.extras = [];
    this.cash_mvts = {
      ETH: [],
      DLT: [],
      EOS: [],
      HBAR: [],
      SOLSCAN: [],
      KSM: [],
      FTM: [],
      POLYGON: [],
    };
  }
  custodians_to_known_wallets_mapper(
    element,
    clients_wallets,
    tradias_wallets
  ) {
    const source_address = element["from"];
    const destination_address = element["to"];
    if (!source_address || !destination_address) {
      console.log();
    }
    const source_address_is_client_address = Object.keys(
      clients_wallets
    ).includes(source_address.toLowerCase());
    const source_address_is_tradias_address = Object.keys(
      tradias_wallets
    ).includes(source_address.toLowerCase());
    const destination_address_is_client_address = Object.keys(
      clients_wallets
    ).includes(destination_address.toLowerCase());
    const destination_address_is_tradias_address = Object.keys(
      tradias_wallets
    ).includes(destination_address.toLowerCase());
    return {
      source_address,
      destination_address,
      source_address_is_client_address,
      source_address_is_tradias_address,
      destination_address_is_client_address,
      destination_address_is_tradias_address,
    };
  }
  async polygon_response_parser(cash_mvts, clients_wallets, tradias_wallets) {
    Object.keys(cash_mvts).map((action_cash_mvt) => {
      cash_mvts[action_cash_mvt].map((element) => {
        let from = element["from"];
        let to = element["to"];
        let {
          source_address,
          destination_address,
          source_address_is_client_address,
          source_address_is_tradias_address,
          destination_address_is_client_address,
          destination_address_is_tradias_address,
        } = this.custodians_to_known_wallets_mapper(
          {
            from,
            to,
          },
          clients_wallets,
          tradias_wallets
        );
        let amount;
        let currency;
        if (action_cash_mvt === "tokentx") {
          amount = element["value"] /( 10 ** element["tokenDecimal"]);
          currency = element['tokenName'];
        } else {
          amount = element["value"] * 10 ** -18;
          currency = "MATIC";
        }

        if (
          source_address_is_client_address &&
          destination_address_is_tradias_address
        ) {
          this.cash_mvts["POLYGON"].push({
            cash_mvt_reference: `${currency}_${element["hash"]}`,
            cash_mvt_curr_code: currency,
            cash_mvt_amnt: amount,
            cash_mvt_date: new Date(
              parseInt(element["timeStamp"]) * 1000
            ).getTime(),
            client_spaceship_id: clients_wallets[source_address]["owner_id"],
            source_address_id: clients_wallets[source_address]["id"],
            destination_address_id: tradias_wallets[destination_address]["id"],
          });
        } else if (
          source_address_is_tradias_address &&
          destination_address_is_client_address
        ) {
          this.cash_mvts["POLYGON"].push({
            cash_mvt_reference: `${currency}_${element["hash"]}`,
            cash_mvt_curr_code: currency,
            cash_mvt_amnt: amount,
            cash_mvt_date: new Date(
              parseInt(element["timeStamp"]) * 1000
            ).getTime(),
            client_spaceship_id: tradias_wallets[source_address]["owner_id"],
            source_address_id: tradias_wallets[source_address]["id"],
            destination_address_id: clients_wallets[destination_address]["id"],
          });
          console.log();
        }
      });
    });
  }
  async hbar_response_parser(cash_mvts, clients_wallets, tradias_wallets) {
    cash_mvts.map((cash_mvt) => {
      let from;
      let to;
      cash_mvt["transfers"].map((transfer) => {
        if (transfer["amount"] > 0) {
          to = transfer["accountID"];
        } else {
          from = transfer["accountID"];
        }
      });
      let {
        source_address,
        destination_address,
        source_address_is_client_address,
        source_address_is_tradias_address,
        destination_address_is_client_address,
        destination_address_is_tradias_address,
      } = this.custodians_to_known_wallets_mapper(
        {
          ...cash_mvt,
          from,
          to,
        },
        clients_wallets,
        tradias_wallets
      );
      if (
        source_address_is_client_address &&
        destination_address_is_tradias_address
      ) {
        const amount_1 = Math.abs(cash_mvt["transfers"][0]["amount"]);
        const amount_2 = Math.abs(cash_mvt["transfers"][1]["amount"]);
        this.cash_mvts["HBAR"].push({
          cash_mvt_reference: `HBAR_${cash_mvt["transactionHash"]}`,
          cash_mvt_curr_code: "HBAR",
          cash_mvt_amnt: amount_1 > amount_2 ? amount_2 : amount_1,
          cash_mvt_date: new Date(cash_mvt["consensusTime"]).getTime(),
          client_spaceship_id: clients_wallets[source_address]["owner_id"],
          source_address_id: clients_wallets[source_address]["id"],
          destination_address_id: tradias_wallets[destination_address]["id"],
        });
      } else if (
        source_address_is_tradias_address &&
        destination_address_is_client_address
      ) {
        const amount_1 = Math.abs(cash_mvt["transfers"][0]["amount"]);
        const amount_2 = Math.abs(cash_mvt["transfers"][1]["amount"]);
        this.cash_mvts["HBAR"].push({
          cash_mvt_reference: `HBAR_${cash_mvt["transactionHash"]}`,
          cash_mvt_curr_code: "HBAR",
          cash_mvt_amnt: amount_1 > amount_2 ? amount_2 : amount_1,
          cash_mvt_date: new Date(cash_mvt["consensusTime"]).getTime(),
          client_spaceship_id: tradias_wallets[source_address]["owner_id"],
          source_address_id: tradias_wallets[source_address]["id"],
          destination_address_id: clients_wallets[destination_address]["id"],
        });
      }
    });
  }
  async eos_response_parser(cash_mvts, clients_wallets, tradias_wallets) {
    cash_mvts.map((element) => {
      let from = element["action_trace"]["act"]["data"]["from"];
      let to = element["action_trace"]["act"]["data"]["to"];
      let {
        source_address,
        destination_address,
        source_address_is_client_address,
        source_address_is_tradias_address,
        destination_address_is_client_address,
        destination_address_is_tradias_address,
      } = this.custodians_to_known_wallets_mapper(
        {
          ...element,
          from:
            from !== undefined
              ? from
              : element["action_trace"]["act"]["data"]["payer"],
          to:
            to !== undefined
              ? to
              : element["action_trace"]["act"]["data"]["receiver"],
        },
        clients_wallets,
        tradias_wallets
      );
      if (
        source_address_is_client_address &&
        destination_address_is_tradias_address
      ) {
        this.cash_mvts["EOS"].push({
          cash_mvt_reference: `EOS_${element["hash"]}`,
          cash_mvt_curr_code: "EOS",
          cash_mvt_amnt:
            element["action_trace"]["act"]["data"]["quantity"].split(" ")[0],
          cash_mvt_date: new Date(element["block_time"]).getTime(),
          client_spaceship_id: clients_wallets[source_address]["owner_id"],
          source_address_id: clients_wallets[source_address]["id"],
          destination_address_id: tradias_wallets[destination_address]["id"],
        });
      } else if (
        source_address_is_tradias_address &&
        destination_address_is_client_address
      ) {
        this.cash_mvts["EOS"].push({
          cash_mvt_reference: `EOS_${element["action_trace"]["trx_id"]}`,
          cash_mvt_curr_code: "EOS",
          cash_mvt_amnt:
            element["action_trace"]["act"]["data"]["quantity"].split(" ")[0],
          cash_mvt_date: parseInt(new Date(element["block_time"]).getTime()),
          client_spaceship_id: tradias_wallets[source_address]["owner_id"],
          source_address_id: tradias_wallets[source_address]["id"],
          destination_address_id: clients_wallets[destination_address]["id"],
        });
      }
    });
  }
  async etherscan_response_parser(cash_mvts, clients_wallets, tradias_wallets) {
    cash_mvts.forEach((element) => {
      let {
        source_address,
        destination_address,
        source_address_is_client_address,
        source_address_is_tradias_address,
        destination_address_is_client_address,
        destination_address_is_tradias_address,
      } = this.custodians_to_known_wallets_mapper(
        element,
        clients_wallets,
        tradias_wallets
      );
      if (
        source_address_is_client_address &&
        destination_address_is_tradias_address
      ) {
        let currency =
          element["request_type"] === "ERC20"
            ? element["tokenSymbol"].toUpperCase().split("_")[0]
            : "ETH";
        let amnt_division_value =
          element["request_type"] !== "ERC20"
            ? 10 ** 18
            : element["tokenDecimal"];

        this.cash_mvts["ETH"].push({
          cash_mvt_reference: `${currency}_${element["hash"]}`,
          cash_mvt_curr_code: currency,
          cash_mvt_amnt: `${(
            parseInt(element["value"]) / amnt_division_value
          ).toFixed(18)}`,
          cash_mvt_date: parseInt(element["timeStamp"]) * 1000,
          client_spaceship_id: clients_wallets[source_address]["owner_id"],
          source_address_id: clients_wallets[source_address]["id"],
          destination_address_id: tradias_wallets[destination_address]["id"],
        });
      } else if (
        source_address_is_tradias_address &&
        destination_address_is_client_address
      ) {
        let currency =
          element["request_type"] === "ERC20"
            ? element["tokenSymbol"].toUpperCase().split("_")[0]
            : "ETH";
        let amnt_division_value =
          element["request_type"] !== "ERC20"
            ? 10 ** 18
            : element["tokenDecimal"];
        this.cash_mvts["ETH"].push({
          cash_mvt_reference: `${currency}_${element["hash"]}`,
          cash_mvt_curr_code: currency,
          cash_mvt_amnt: `${(
            parseInt(element["value"]) / amnt_division_value
          ).toFixed(18)}`,
          cash_mvt_date: parseInt(element["timeStamp"]) * 1000,
          client_spaceship_id: tradias_wallets[source_address]["owner_id"],
          source_address_id: tradias_wallets[source_address]["id"],
          destination_address_id: clients_wallets[destination_address]["id"],
        });
      }
    });
  }
  async dlt_response_parser(dlt_deposits, dlt_withdrawals) {
    const client_addresses = Object.keys(
      this.spaceship_controller.clients_addresses
    );
    const { clients_wallets, tradias_wallets } =
      await this.get_clients_and_tradias_wallets();
    dlt_deposits.forEach((cash_mvt) => {
      const destination_address = cash_mvt["deposit_address"];
      const source_address = cash_mvt["deposit_sources"][0]["address"];
      this.dlt_cash_mvt_mapper(
        cash_mvt,
        source_address,
        destination_address,
        clients_wallets,
        tradias_wallets,
        "DEPOSIT",
        "DLT"
      );
    });
    dlt_withdrawals.forEach((cash_mvt) => {
      const source_address = cash_mvt["source_address"];
      const destination_address = cash_mvt["destination_address"]["address"];
      this.dlt_cash_mvt_mapper(
        cash_mvt,
        source_address,
        destination_address,
        clients_wallets,
        tradias_wallets,
        "WITHDRAWAL",
        "DLT"
      );
    });
    return {
      clients_id_to_withdrawal_mapping: this.clients_id_to_withdrawal_mapping,
      clients_id_to_deposit_mapping: this.clients_id_to_deposit_mapping,
    };
  }
}
module.exports = CustodianResponseParser;
