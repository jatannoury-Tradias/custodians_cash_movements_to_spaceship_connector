const csv_keys_to_avoid = require("../config/csv_keys_to_avoid");
const FlowController = require("../controllers/flow_controller");
const SpaceshipController = require("../controllers/spaceship_controller");
const data_to_filter = require("../data/test_data/data_to_filter");
const CashMvtsMapper = require("../helpers/cahs_mvts_mapper");
var logger = require("tracer").console();

let csv_keys = [];
let spaceship_supported_currencies = [];
function check_keys(cash_mvt) {
  const result = csv_keys.every((element) =>
    Object.keys(cash_mvt).includes(element)
  );
  if (!result) {
    logger.warn(
      "FILTER: Cash movement filtered due to invalid keys:",
      cash_mvt
    );
  }
  return result;
}

function check_account_holders(cash_mvt) {
  const result = !(
    cash_mvt.recipient_address_owner === "Tradias GmbH" &&
    cash_mvt.sender_address_owner === "Tradias GmbH"
  );
  if (!result) {
    logger.warn(
      "FILTER: Cash movement filtered due to invalid account holders:",
      cash_mvt
    );
  }
  return result;
}

function check_labels(cash_mvt) {
  const recipient_check =
    cash_mvt.recipient_address_label.toLowerCase() === "trade republic" ||
    cash_mvt.recipient_address_label.toLowerCase() === "thomas pischke" ||
    cash_mvt.recipient_address_label.toLowerCase() === "dwp";
  const sender_check =
    cash_mvt.sender_address_label.toLowerCase() === "trade republic" ||
    cash_mvt.sender_address_label.toLowerCase() === "thomas pischke" ||
    cash_mvt.sender_address_label.toLowerCase() === "dwp";
  const result = !(recipient_check || sender_check);
  if (!result) {
    logger.warn(
      "FILTER: Cash movement filtered due to invalid labels:",
      cash_mvt
    );
  }
  return result;
}

function check_date_range(cash_mvt, from_date, to_date) {
  if (!(from_date instanceof Date)) {
    from_date = new Date(from_date);
  }
  if (!(to_date instanceof Date)) {
    to_date = new Date(to_date);
  }
  const cash_mvt_date_object = new Date(cash_mvt.executed_at);
  const result =
    cash_mvt_date_object >= from_date && cash_mvt_date_object <= to_date;
  if (!result) {
    logger.warn(
      "FILTER: Cash movement filtered due to invalid date range:",
      cash_mvt
    );
  }
  return result;
}

function check_amount(cash_mvt) {
  const amount = cash_mvt.amount;
  const result =
    amount > 0 &&
    amount !== Infinity &&
    amount !== null &&
    amount !== undefined;
  if (!result) {
    logger.warn(
      "FILTER: Cash movement filtered due to invalid amount:",
      cash_mvt
    );
  }
  return result;
}

function check_currencies(cash_mvt) {
  const result = spaceship_supported_currencies.includes(
    cash_mvt.currency_code
  );
  if (!result) {
    logger.warn(
      "FILTER: Cash movement filtered due to unsupported currency:",
      cash_mvt
    );
  }
  return result;
}
async function initialize_supporting_data() {
  if (spaceship_supported_currencies.length === 0) {
    spaceship_supported_currencies =
      await new SpaceshipController().get_supported_currencies();
  }

  if (csv_keys.length === 0) {
    csv_keys = Object.keys(new CashMvtsMapper().parse_csv_config()[0]).filter(
      (element) => !csv_keys_to_avoid.includes(element)
    );
  }
}
function filter_cash_movements(cash_movements, from_date, to_date) {
  let all_data = [];
  for (const cash_mvt_type in cash_movements) {
    cash_movements[cash_mvt_type] = cash_movements[cash_mvt_type].filter(
      (cash_mvt) => {
        return (
          check_keys(cash_mvt) &&
          check_account_holders(cash_mvt) &&
          check_labels(cash_mvt) &&
          check_date_range(cash_mvt, from_date, to_date) &&
          check_amount(cash_mvt) &&
          check_currencies(cash_mvt)
        );
      }
    );
    all_data = [...all_data, ...cash_movements[cash_mvt_type]];
  }
  return all_data;
}

async function filter_data(
  data,
  clients_wallets,
  tradias_wallets,
  from_date,
  to_date
) {
  await initialize_supporting_data();
  let gathered_data = [];
  for (const currency in data) {
    if (currency !== "oklink") {
      gathered_data = [
        ...gathered_data,
        ...filter_cash_movements(data[currency], from_date, to_date),
      ];
    } else {
      for (const oklink_currency in data["oklink"]) {
        gathered_data = [
          ...gathered_data,
          ...filter_cash_movements(
            data["oklink"][oklink_currency],
            from_date,
            to_date
          ),
        ];
      }
    }
  }
  return gathered_data;
}

module.exports = { filter_data };
if (require.main === module) {
  (async function initialize() {
    let from_date = "2023-09-13 23:59:59";
    let to_date = "2024-01-25 23:59:59";
    let flow_controller = new FlowController();
    const { clients_wallets, tradias_wallets } =
      flow_controller.wallets_to_lower_case(
        await flow_controller.get_clients_and_tradias_wallets()
      );
    let filtered_data = await filter_data(
      data_to_filter,
      clients_wallets,
      tradias_wallets,
      from_date,
      to_date
    );
    await flow_controller.push_transactions(filtered_data, {
      ...clients_wallets,
      ...tradias_wallets,
    });
  })();
}
