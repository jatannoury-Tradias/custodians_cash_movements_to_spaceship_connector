const TanganyController = require("../controllers/tangany_controller");

class CustodiansRequests extends TanganyController{
  constructor() {
    super()
  }
  
  async make_tangany_api_request(url, from_date, to_date) {
    const response = await this.eth_request(url)
    console.log()
  }
  async make_dlt_api_request(request_type, from_date, to_date) {
    const { nonce, page, limit, signature, from, to } =
      await this.parse_dlt_request_inputs(from_date, to_date, request_type);
    const promise = await fetch(
      `https://api.dltm.quanttradingfactory.com/v1/report/custody/client/${request_type}?from=${from}&to=${to}&state=${"done"}&page=${page}&limit=${limit}`,
      {
        headers: {
          "X-Public-Key": this.public_key,
          "X-Signature": signature,
          "X-Nonce": nonce,
        },
      }
    ).then((res) => {
      return res.json();
    });
    return promise.records;
  }
}
async function eth_tangany_caller() {
  let custodians_request_instance = new CustodiansRequests();
  await custodians_request_instance.make_tangany_api_request(
    "https://api.etherscan.io/api?",
    null,
    null
  );
}
if (require.main === module) {
  eth_tangany_caller();
}
module.exports = CustodiansRequests;
