class CustodiansRequests {
  constructor() {}
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
module.exports = CustodiansRequests;
