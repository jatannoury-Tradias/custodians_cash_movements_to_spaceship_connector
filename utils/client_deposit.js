const fs = require("fs");
var logger = require("tracer").console();
const jsonFilePath =
  "C:\\Users\\jtannoury\\Desktop\\settlement_request_project\\custodians_cash_movements_to_spaceship_connector\\data\\static_data\\account_holders_names_mappers.json";

let account_holders_mapping = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
function extract_sender_address_label_and_network_and_custodian_from_cash_mvt(
  cash_mvt,
  destination_address
) {
  const splitted_label = cash_mvt.recipient_address_label.split("-");
  let sender_address_label;
  let custodian;
  let network;
  if (splitted_label.length !== 3) {
    logger.warn(
      "Malformated Label. Please change the format on spaceship to the following: CUSTODIAN - SENDER - NETWORK"
    );
  } else {
    network = splitted_label.pop().trim();
  }
  sender_address_label = splitted_label.pop().trim();
  custodian = splitted_label[0].trim();
  return { custodian, sender_address_label, network };
}

function check_cash_mvt_counterparties(
  flow_controller_instance,
  cash_mvt,
  clients_wallets,
  tradias_wallets
) {
  const {
    source_address,
    destination_address,
    source_address_is_client_address,
    source_address_is_tradias_address,
    destination_address_is_client_address,
    destination_address_is_tradias_address,
  } = flow_controller_instance.custodians_to_known_wallets_mapper(
    cash_mvt,
    clients_wallets,
    tradias_wallets
  );
  if (
    !source_address_is_tradias_address &&
    destination_address_is_tradias_address &&
    ["dltcustody - pool wallet", "tangany - pool wallet"].includes(
      tradias_wallets[destination_address.toLowerCase()].label.toLowerCase()
    ) === false
  ) {
    const { custodian, sender_address_label, network } =
      extract_sender_address_label_and_network_and_custodian_from_cash_mvt(
        cash_mvt,
        tradias_wallets,
        destination_address
      );
    const account_holder = account_holders_mapping?.[sender_address_label];
    if (!account_holder || account_holder.length === 0) {
      return false;
    }
    return {
      custodian,
      sender_address_label,
      account_holder: account_holder,
      network,
    };
  }
}
function assign_sender(
  cash_mvt,
  flow_controller_instance,
  clients_wallets,
  tradias_wallets
) {
  if (Object.keys(cash_mvt).length === 0) {
    return;
  } else if (cash_mvt.sender_address) {
    return;
  }
  const counterparties_check = check_cash_mvt_counterparties(
    flow_controller_instance,
    cash_mvt,
    clients_wallets,
    tradias_wallets
  );

  if (counterparties_check && !cash_mvt.sender_address) {
    const spaceship_lookup = Object.values(clients_wallets).filter(
      (element) => {
        return (
          element.label === counterparties_check.sender_address_label &&
          element.currencies.includes(cash_mvt.currency_code) &&
          counterparties_check.account_holder.includes(element.owner_name)
        );
      }
    );
    if (spaceship_lookup.length !== 0) {
      cash_mvt.sender_address = spaceship_lookup[0].address;
    }
  }
}
async function client_deposit(
  data,
  flow_controller_instance,
  clients_wallets,
  tradias_wallets
) {
  for (const currency of Object.keys(data)) {
    if (currency.toLowerCase() === "oklink") {
      for (let oklink_currency of Object.keys(data["oklink"])) {
        for (const cash_mvt_type of Object.keys(
          data["oklink"][oklink_currency]
        )) {
          Object.values(
            data["oklink"][oklink_currency]?.[cash_mvt_type] || []
          ).forEach((cash_mvt) => {
            assign_sender(
              cash_mvt,
              flow_controller_instance,
              clients_wallets,
              tradias_wallets
            );
          });
        }
      }
    } else {
      for (const cash_mvt_type of Object.keys(data[currency])) {
        Object.values(data[currency]?.[cash_mvt_type] || []).forEach(
          (cash_mvt) => {
            assign_sender(
              cash_mvt,
              flow_controller_instance,
              clients_wallets,
              tradias_wallets
            );
          }
        );
      }
    }
  }
}

module.exports = {
  client_deposit,
};
