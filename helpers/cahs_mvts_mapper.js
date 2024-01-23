const fs = require("fs");
class CashMvtsMapper {
  constructor() {}
  // Custom function to parse a CSV row with quoted fields
  parseCSVRow(row) {
    const values = [];
    let currentField = "";

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === ",") {
        values.push(currentField);
        currentField = "";
      } else if (char === '"') {
        // Handle quoted field
        const closingQuoteIndex = row.indexOf('"', i + 1);
        currentField += row.substring(i + 1, closingQuoteIndex);
        i = closingQuoteIndex; // Skip the quoted part
      } else {
        currentField += char;
      }
    }

    values.push(currentField); // Add the last field

    return values;
  }
  parse_csv_config() {
    const config = [];

    // Read the CSV file
    let csvFilePath =
      "C:/Users/jtannoury/Desktop/settlement_request_project/custodians_cash_movements_to_spaceship_connector/data/static_data/custodians_response_parser_mapper.csv";
    const fileContent = fs.readFileSync(csvFilePath, "utf8");

    const rows = fileContent.trim().split("\n");
    const headers = rows[0].split(",");

    for (let i = 1; i < rows.length; i++) {
      const values = this.parseCSVRow(rows[i]);
      const rowObject = {};

      for (let j = 0; j < headers.length; j++) {
        rowObject[headers[j]?.trim()] = values[j]?.trim();
      }

      config.push(rowObject);
    }

    return config;
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
      if (
        source_address_is_client_address &&
        destination_address_is_tradias_address
      ) {
        let currency = cash_mvt["currency_code"].toUpperCase().split("_")[0];
        this.cash_mvts["DLT"].push({
          cash_mvt_reference: `${currency}_${cash_mvt["compliance_tx_hash"]}`,
          cash_mvt_curr_code: currency,
          cash_mvt_amnt: cash_mvt["compliance_amount"],
          cash_mvt_date: cash_mvt["compliance_received_at"],
          client_spaceship_id: clients_wallets[source_address]["owner_id"],
          source_address_id: clients_wallets[source_address]["id"],
          destination_address_id: tradias_wallets[destination_address]["id"],
        });
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
      if (
        destination_address_is_client_address &&
        source_address_is_tradias_address
      ) {
        let currency = cash_mvt["currency_code"].toUpperCase().split("_")[0];
        this.cash_mvts["DLT"].push({
          cash_mvt_reference: `${currency}_${cash_mvt["tx_hash"]}`,
          cash_mvt_curr_code: currency,
          cash_mvt_amnt: cash_mvt["received_amount"],
          cash_mvt_date: cash_mvt["updated_at"],
          client_spaceship_id: tradias_wallets[source_address]["owner_id"],
          source_address_id: tradias_wallets[source_address]["id"],
          destination_address_id: clients_wallets[destination_address]["id"],
        });
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
}
module.exports = CashMvtsMapper;
