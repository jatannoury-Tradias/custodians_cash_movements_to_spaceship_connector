const FlowController = require("./controllers/flow_controller");

async function main() {
  try {
    let flow_controller = new FlowController();
    await flow_controller.custodians_cash_mvts_to_spaceship_wallets_resolver();
  } catch (e) {
    console.log()
  }
}
main();
