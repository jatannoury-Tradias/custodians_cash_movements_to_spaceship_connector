const FlowController = require("./controllers/flow_controller");

async function main() {
  try {
    let flow_controller = new FlowController();
    await flow_controller.custodians_cash_mvts_to_spaceship_wallets_resolver();
    await flow_controller.push_transactions(flow_controller.clients_deposits,flow_controller.clients_deposits)
  } catch (e) {
    console.log(e);
  }
}
main();
