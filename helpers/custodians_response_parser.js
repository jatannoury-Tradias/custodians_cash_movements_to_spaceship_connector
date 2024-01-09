const CashMvtsMapper = require("./cahs_mvts_mapper");
const fs = require("fs");
const csvParse = require("csv-parse");
const action_mappers = require("../config/action_mappers");
const time_unit_mapper = require("../config/time_unit_mapper");
const custom_functions = require("../utils/custom_functions");
class CustodianResponseParser extends CashMvtsMapper {
  constructor() {
    super();
    this.clients_deposits = [];
    this.clients_withdrawals = [];
    this.extras = [];
    this.cash_mvts = {};
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
  extract_index_from_string(required_string) {
    const regex = /\[(\d+)\]/;
    const match = required_string.match(regex);

    if (match) {
      const index = parseInt(match[1], 10);
      return index;
    } else {
      return undefined;
    }
  }
  parse_status_filter(config_value, cash_mvt) {
    config_value = config_value.trim();
    return eval(this.replace_variables_with_values(config_value, cash_mvt));
    if (config_value.includes("not equal")) {
      let splitted_values = config_value.split("not equal");
      return cash_mvt[splitted_values[0].trim()] !== splitted_values[1].trim();
    } else if (config_value.includes("equal")) {
      let splitted_values = config_value.split("equal");
      try {
        return (
          eval(cash_mvt[splitted_values[0].trim()]) ===
          eval(splitted_values[1].trim())
        );
      } catch (error) {
        return (
          cash_mvt[splitted_values[0].trim()] === splitted_values[1].trim()
        );
      }
    }
  }
  replace_variables_with_values(config_value, cash_mvt) {
    const regex = /\$\w+(\.\w+)*\$/g;

    // Replace the matched patterns in the expression with the corresponding values
    let modified_expression = config_value.replace(regex, (match) => {
      // Extract the access path from the matched pattern (remove $$)
      const accessPath = match.slice(1, -1);

      // Call the function to get the value from the JSON
      const value = this.parse_value_access_from_syntax(accessPath, cash_mvt);

      // If the value is a string, wrap it with double quotes
      const replacedValue = typeof value === "string" ? `"${value}"` : value;

      // Return the value to replace the matched pattern
      return replacedValue;
    });
    return modified_expression;
  }
  parse_value_access_from_syntax(config_value, cash_mvt) {
    let json_keys = config_value.split(".");
    let cash_mvt_copy = { ...cash_mvt };
    json_keys.forEach((element) => {
      const extracted_index = this.extract_index_from_string(element);
      if (extracted_index !== undefined) {
        cash_mvt_copy =
          cash_mvt_copy[element.split(`[${extracted_index}]`)[0].trim()][
            extracted_index
          ];
      } else {
        cash_mvt_copy = cash_mvt_copy[element];
      }
    });
    return cash_mvt_copy;
  }
  parse_sender_address(config_value, cash_mvt) {
    if (config_value.startsWith("custom_functions")) {
      const function_name = config_value.split(".")[1];
      return custom_functions[function_name](cash_mvt);
    }
    return this.parse_value_access_from_syntax(config_value, cash_mvt);
  }
  parse_receiver_address(config_value, cash_mvt) {
    if (config_value.startsWith("custom_functions")) {
      const function_name = config_value.split(".")[1];
      return custom_functions[function_name](cash_mvt);
    }
    return this.parse_value_access_from_syntax(config_value, cash_mvt);
  }
  parse_amount(config_value, cash_mvt) {
    return eval(this.replace_variables_with_values(config_value, cash_mvt));
  }
  parse_date(config_value, cash_mvt, mapped_data) {
    const is_decimal_regex = /^\d+$/;
    let retrieved_date = this.parse_value_access_from_syntax(
      config_value,
      cash_mvt
    );
    if (
      Number.isInteger(retrieved_date) ||
      is_decimal_regex.test(retrieved_date)
    ) {
      let curr_unit_to_seconds_converter =
        10 ** (String(retrieved_date).length - 13); // 13 represents the length of a unix ts string in seconds
      return new Date(
        parseFloat(retrieved_date) / curr_unit_to_seconds_converter
      );
    }
    return new Date(retrieved_date);
  }
  parse_currency_code(config_value, cash_mvt, mapped_data) {
    if (config_value.match(/\$/g)?.length % 2 === 0) {
      config_value = this.replace_variables_with_values(config_value, cash_mvt);
      return eval(config_value);
    }
    return this.parse_value_access_from_syntax(config_value, cash_mvt);
  }
  parse_reference(config_value, cash_mvt, mapped_data) {
    if (config_value.startsWith("$currency_code$")) {
      // config_value = config_value.replace(
      //   "$currency_code$",
      //   `'${mapped_data.currency_code}'`
      // );
    }
    // Define a regular expression to match patterns like "$...$"
    const regex = /\$\w+(\.\w+)*\$/g;

    // Replace the matched patterns in the expression with the corresponding values
    let modified_expression = config_value.replace(regex, (match) => {
      // Extract the access path from the matched pattern (remove $$)
      const accessPath = match.slice(1, -1);

      // Call the function to get the value from the JSON
      const value = this.parse_value_access_from_syntax(accessPath, cash_mvt);

      // Return the value to replace the matched pattern
      return `'${value}'`;
    });
    try {
      return eval(modified_expression);
    } catch (error) {
      return eval("'" + modified_expression);
    }
  }
  parse_config_value(config_value, config_key, cash_mvt, mapped_data) {
    if (config_value.toLowerCase() === "from spaceship") {
      return "From Spaceship";
    } else if (config_value.toLowerCase().startsWith("fixed value")) {
      return config_value.slice("fixed value".length).trim();
    } else if (config_key.toLowerCase() === "status_filter") {
      return this.parse_status_filter(config_value, cash_mvt);
    } else if (config_key.toLowerCase() === "sender_address") {
      return this.parse_sender_address(config_value, cash_mvt);
    } else if (config_key.toLowerCase() === "amount") {
      return this.parse_amount(config_value, cash_mvt);
    } else if (config_key.toLowerCase() === "recipient_address") {
      return this.parse_receiver_address(config_value, cash_mvt);
    } else if (config_key.toLowerCase() === "amount") {
      return this.parse_amount(config_value, cash_mvt);
    } else if (config_key.toLowerCase() === "executed_at") {
      return this.parse_date(config_value, cash_mvt, mapped_data);
    } else if (config_key.toLowerCase() === "currency_code") {
      return this.parse_currency_code(config_value, cash_mvt, mapped_data);
    } else if (config_key.toLowerCase() === "reference") {
      return this.parse_reference(config_value, cash_mvt, mapped_data);
    } else {
      return cash_mvt[config_value.toLowerCase()];
    }
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
}

module.exports = CustodianResponseParser;
