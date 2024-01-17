function filter_data(data, clients_wallets, tradias_wallets) {
  for (const currency of Object.keys(data)) {
    for (const cash_mvt_type of Object.keys(data["oklink"][currency])) {
      Object.values(data["oklink"][currency]?.[cash_mvt_type] || []).map();
    }
  }
}

module.exports = { filter_data };
