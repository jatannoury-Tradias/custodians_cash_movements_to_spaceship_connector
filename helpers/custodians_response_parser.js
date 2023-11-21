class CustodianResponseParser {
  constructor() {
    this.clients_deposits = [];
    this.clients_withdrawals = [];
    this.extras = [];
  }
  dlt_cash_mvt_mapper(
    cash_mvt,
    source_address,
    destination_address,
    clients_wallets,
    tradias_wallets,
    cash_mvt_type,
    reference
  ) {
    const source_address_is_client_address =
      Object.keys(clients_wallets).includes(source_address);
    const source_address_is_tradias_address =
      Object.keys(tradias_wallets).includes(source_address);
    const destination_address_is_client_address =
      Object.keys(clients_wallets).includes(destination_address);
    const destination_address_is_tradias_address =
      Object.keys(tradias_wallets).includes(destination_address);
    if (
      !source_address_is_client_address &&
      !source_address_is_tradias_address &&
      !destination_address_is_client_address &&
      !destination_address_is_tradias_address
    ) {
      this.wallets_with_no_spaceship_mapping.push({
        currency: cash_mvt.currency_code.toUpperCase(),
        source_address,
        destination_address,
        cash_mvt_date: cash_mvt["compliance_received_at"],
        cash_mvt_type,
        reference,
      });
      return;
    }
    if (cash_mvt_type === "DEPOSIT") {
      if (source_address_is_client_address) {
        this.clients_deposits.push({...cash_mvt,client_spaceship_id:clients_wallets[source_address]['owner_id']});
      } else {
        this.wallets_with_no_spaceship_mapping.push({
          currency: cash_mvt.currency_code.toUpperCase(),
          source_address,
          destination_address,
          cash_mvt_date: cash_mvt["compliance_received_at"],
          cash_mvt_type,
          reference,
        });
      }
    } else {
      if (destination_address_is_client_address) {
        this.clients_withdrawals.push({...cash_mvt,client_spaceship_id:clients_wallets[source_address]['owner_id']});
      } else {
        this.wallets_with_no_spaceship_mapping.push({
          currency: cash_mvt.currency_code.toUpperCase(),
          source_address,
          destination_address,
          cash_mvt_date: cash_mvt["compliance_received_at"],
          cash_mvt_type,
          reference,
        });
      }
    }
    console.log();
  }
  dlt_response_parser(dlt_deposits, dlt_withdrawals) {
    const client_addresses = Object.keys(
      this.spaceship_controller.clients_addresses
    );
    const { clients_wallets, tradias_wallets } =
      this.get_clients_and_tradias_wallets();
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
      const destination_address = cash_mvt["destination_address"];
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
