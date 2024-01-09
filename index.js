const FlowController = require("./controllers/flow_controller");

async function main() {
  try {
    let flow_controller = new FlowController();
    // let from_date = "2023-12-19 00:00:00";
    // let to_date = "2023-12-21 23:59:59";
    let from_date = null;
    let to_date = null;
    let collected_currencies_data =
      await flow_controller.collect_currencies_data(from_date, to_date);
    // await flow_controller.fiat_connections_to_spaceship_wallets_resolver(
    //   from_date,
    //   to_date
    // );
    await flow_controller.parse_data(collected_currencies_data);

    await flow_controller.push_transactions(flow_controller.cash_mvts);
  } catch (e) {
    console.log(e);
  }
}

async function run() {
  try {
    await main();
    console.log("Main function completed successfully.");
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

// Call the run function
run();
