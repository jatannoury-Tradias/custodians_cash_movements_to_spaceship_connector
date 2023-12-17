const FlowController = require("./controllers/flow_controller");

async function main() {
  try {
    let flow_controller = new FlowController();
    // let from_date = "2023-11-20 00:00:00";
    // let to_date = "2023-11-27 23:59:59";\
     let from_date = null;
     let to_date = null;
    await flow_controller.custodians_cash_mvts_to_spaceship_wallets_resolver(from_date,to_date);
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


