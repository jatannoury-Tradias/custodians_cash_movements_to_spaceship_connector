const CashMvtsMapper = require("./cahs_mvts_mapper");
const fs = require("fs");
var logger = require("tracer").console();
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
    const source_address = element.sender_address;
    const destination_address = element.recipient_address;
    if (Object.keys(element).length === 0) {
      return {};
    }
    if (!source_address || !destination_address) {
      console.log();
    }
    const source_address_is_client_address = Object.keys(
      clients_wallets
    ).includes(source_address?.toLowerCase());
    const source_address_is_tradias_address = Object.keys(
      tradias_wallets
    ).includes(source_address?.toLowerCase());
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
  parse_status_filter(config_value, cash_mvt, custodian, config_key) {
    config_value = config_value.trim();
    let replaced_value = this.replace_variables_with_values(
      config_value,
      cash_mvt
    );
    if (replaced_value === undefined) {
      logger.warn(
        `Couldn't extract data for config_key of ${config_key} having config_value of ${config_value} for custodian ${custodian}`
      );
      return undefined;
    } else if (replaced_value.includes("undefined")) {
      logger.warn(
        `Couldn't extract data for config_key of ${config_key} having config_value of ${config_value} for custodian ${custodian}`
      );
      return undefined;
    }
    return eval(replaced_value);
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
      if (!isNaN(+value)) {
        return +value;
      }
      const replacedValue = typeof value === "string" ? `"${value}"` : value;

      // Return the value to replace the matched pattern
      return replacedValue;
    });
    if (modified_expression.includes("undefined")) {
      return undefined;
    }
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
  parse_config_value_from_spaceship(
    config_value,
    config_key,
    cash_mvt,
    mapped_data,
    tradias_wallets,
    clients_wallets
  ) {
    let counterparty = config_key
      .toLowerCase()
      .replace("_label", "")
      .replace("_owner", "")
      .trim();
    const spaceship_wallets_lookup =
      clients_wallets[mapped_data[counterparty]?.toLowerCase()] ||
      tradias_wallets[mapped_data[counterparty]?.toLowerCase()];
    if (!spaceship_wallets_lookup) {
      logger.warn(
        `${mapped_data[
          counterparty
        ]?.toLowerCase()} address not found in spaceship`
      );
      return undefined;
    }
    if (config_key.includes("_label")) {
      return spaceship_wallets_lookup.label;
    } else {
      return (mapped_data[`${config_key}_name`] =
        spaceship_wallets_lookup.owner_name);
      // mapped_data[`${config_key}_id`] = spaceship_wallets_lookup.owner_id;
    }
  }
  parse_config_value(config_value, config_key, cash_mvt, mapped_data) {
    if (config_value.toLowerCase().startsWith("fixed value")) {
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
  

  
}

module.exports = CustodianResponseParser;
