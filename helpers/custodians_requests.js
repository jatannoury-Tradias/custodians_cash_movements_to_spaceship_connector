const TanganyController = require("../controllers/tangany_controller");

class CustodiansRequests extends TanganyController {
  constructor() {
    super();
  }

  async make_tangany_api_request(
    url,
    from_date = null,
    to_date = null,
    tangany_name
  ) {
    switch (tangany_name) {
      case "ETH":
        return await this.etherscan_instance.eth_request(
          url,
          from_date,
          to_date
        );
      case "EOS":
        return await this.eos_instance.eos_request(url, from_date, to_date);
      case "HBAR":
        return await this.hbar_instance.hbar_request(url, from_date, to_date);
      case "SOL":
        return await this.sol_instance.sol_request(url, from_date, to_date);
      case "POLYGON":
        return await this.polygon_instance.polygon_request(url, from_date, to_date);
      default:
        throw Error(
          `${tangany_name} is not configured!! Please go to the CustodiansRequest class and modify the switch statement`
        );
    }
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
  console.log(
    await custodians_request_instance.make_tangany_api_request(
      "https://api.etherscan.io/api?",
      null,
      null,
      "ETH"
    )
  );
}
if (require.main === module) {
  eth_tangany_caller();
}
module.exports = CustodiansRequests;
