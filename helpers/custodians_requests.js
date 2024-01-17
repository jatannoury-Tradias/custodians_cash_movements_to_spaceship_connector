const TanganyController = require("../controllers/tangany_controller");
const { response_parser } = require("../utils/response_parser");

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
      case "EOS":
        return await this.eos_instance.eos_request(url, from_date, to_date);
      case "HBAR":
        return await this.hbar_instance.hbar_request(url, from_date, to_date);
      case "SOL":
        return await this.sol_instance.sol_request(url, from_date, to_date);
      case "FTM":
        return await this.ftm_instance.ftm_request(url, from_date, to_date);
      case "KSM":
        return await this.ksm_instance.ksm_request(url, from_date, to_date);
      case "ATOM":
        return await this.oklink_instance.atom_request(url, from_date, to_date);
      case "NEAR":
        return await this.near_instance.near_request(url, from_date, to_date);
      case "SGB":
        return await this.sgb_instance.sgb_request(url, from_date, to_date);
      case "XTZ":
        return await this.xtz_instance.xtz_request(url, from_date, to_date);
      case "CELO":
        return await this.celo_instance.celo_request(url, from_date, to_date);
      case "OKLINK":
        return await this.oklink_instance.oklink_request(
          url,
          from_date,
          to_date
        );
      case "ETH":
        return await this.etherscan_instance.eth_request(
          url,
          from_date,
          to_date
        );
      case "POLYGON":
        return await this.polygon_instance.polygon_request(
          url,
          from_date,
          to_date
        );
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
    ).then(async (res) => {
      return await response_parser(res, 200, "DLT");
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
