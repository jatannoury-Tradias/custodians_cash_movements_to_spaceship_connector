const env = process.env;

const addresses = {
  BTC: env.BTC_ACCOUNT_ADDRESS,
  DOGE: env.DOGE_ACCOUNT_ADDRESS,
};

function oklink_super_specials_to(cash_mvt) {
  if (parseFloat(cash_mvt.amount) > 0) {
    return addresses[cash_mvt.transactionSymbol];
  }
  let to_arr = cash_mvt.from.split(",");
  to_arr = [
    ...new Set(
      to_arr.filter(
        (element) => element !== addresses[cash_mvt.transactionSymbol]
      )
    ),
  ];
  if (to_arr.length === 1) {
    return to_arr[0];
  } else if (to_arr.length === 2) {
    logger.error(
      `Couldn't recognize the to address for the following payload: ${JSON.stringify(
        cash_mvt
      )}`
    );
    return undefined;
  }
}
function oklink_super_specials_from(cash_mvt) {
  if (parseFloat(cash_mvt.amount) < 0) {
    return addresses[cash_mvt.transactionSymbol];
  }
  let to_arr = cash_mvt.from.split(",");
  to_arr = [
    ...new Set(
      to_arr.filter(
        (element) => element !== addresses[cash_mvt.transactionSymbol]
      )
    ),
  ];
  if (to_arr.length === 1) {
    return to_arr[0];
  } else if (to_arr.length === 2) {
    console.log(
      `Couldn't recognize the to address for the following payload: ${JSON.stringify(
        cash_mvt
      )}`
    );
    return undefined;
  }
}
module.exports = {
  oklink_super_specials_from,
  oklink_super_specials_to,
};
