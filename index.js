const TanganyParams = require("./config/tangany_params");
const FlowController = require("./controllers/flow_controller");
var logger = require("tracer").console();

async function main() {
  try {
    let flow_controller = new FlowController();
    let tangany_params_instance = new TanganyParams();
    let from_date = "2023-01-13 23:59:59";
    let to_date = "2023-05-14 23:59:59";
    // let from_date = null;
    // let to_date = null;
    const requests_addresses = await tangany_params_instance.address_service_instance.get_requests_addresses()
    logger.info(
      `Input dates to be used in the custodians requests: from_date:${from_date}, to_date:${to_date}`
    );
    logger.info(`Fetching clients wallets and tradias wallets`);
    const { clients_wallets, tradias_wallets } =
      flow_controller.wallets_to_lower_case(
        await flow_controller.get_clients_and_tradias_wallets()
      );
    logger.info(
      "Fetching clients wallets and tradias wallets , collecting custodians currencies data"
    );
    let collected_currencies_data =
      await flow_controller.collect_currencies_data(from_date, to_date,requests_addresses);
    logger.info(
      "Finished collecting custodians currencies data, proceeding with fiat data"
    );
    // await flow_controller.fiat_connections_to_spaceship_wallets_resolver(
    //   from_date,
    //   to_date
    // );
    logger.info("Finished collecting fiat data, proceeding with data parsing");
    await flow_controller.parse_data(
      collected_currencies_data,
      clients_wallets,
      tradias_wallets
    );
    logger.info("Finished parsing data, pushing data to the server");

    // await flow_controller.push_transactions(flow_controller.cash_mvts);
  } catch (e) {
    logger.error(e);
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
