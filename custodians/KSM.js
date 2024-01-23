const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");
require("dotenv").config();

class KSM extends TanganyParams {
  constructor() {
    super();
    const env = process.env;
  }
  async get_block_numbers(from_date = null, to_date = null) {
    let start_date_timestamp;
    let end_time_timestamp;

    if (!from_date || !to_date) {
      ({ start_date_timestamp, end_time_timestamp } =
        get_curr_day_to_curr_plus_one_midnight_date());
    } else {
      start_date_timestamp = new Date(from_date).getTime();
      end_time_timestamp = new Date(to_date).getTime();
    }
    const start_block_nb = await fetch(
      "https://kusama.api.subscan.io/api/scan/block",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Apidog/1.0.0 (https://apidog.com)",
        },
        body: JSON.stringify({
          block_timestamp: start_date_timestamp,
        }),
      }
    )
      .then(async (res) => await res.json())
      .then((res) => {
        return res.data.block_num;
      });
    const end_block_nb = await fetch(
      "https://kusama.api.subscan.io/api/scan/block",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Apidog/1.0.0 (https://apidog.com)",
        },
        body: JSON.stringify({
          block_timestamp: end_time_timestamp,
        }),
      }
    )
      .then(async (res) => await res.json())
      .then((res) => res.data.block_num);
    return [start_block_nb, end_block_nb];
  }
  async do_ksm_request(url, block_num_range, address, from = null) {
    return await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "Apidog/1.0.0 (https://apidog.com)",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: address,
        block_range: block_num_range,
        page: from ? from : 0,
        row: 100,
      }),
    }).then(
      async (res) =>
        await response_parser(res, 200, `KSM for address ${address}`)
    );
  }
  async ksm_request(url, from_date, to_date, requests_addresses) {
    url = `${url}/transfers?`;
    let all_ksm_res = {
      txlist: [],
    };
    let block_num_range = await this.get_block_numbers(from_date, to_date);
    for (let address of requests_addresses.ksm) {
      let ksm_res = await this.do_ksm_request(
        url,
        `${block_num_range[0]}-${block_num_range[1]}`,
        address
      );
      all_ksm_res.txlist = [
        ...(ksm_res["data"]["transfers"] || []),
        ...all_ksm_res.txlist,
      ];
      //PAGINATION
      while (ksm_res["data"]["count"] - all_ksm_res.txlist.length !== 0) {
        let ksm_res = await this.do_ksm_request(
          url,
          block_num_range,
          address,
          all_ksm_res.txlist.length
        );
        all_ksm_res.txlist = [
          ...all_ksm_res.txlist,
          ...(ksm_res?.data?.transfers || []),
        ];
      }
      await sleep(this.mapped_timeouts.ksm);
    }

    return all_ksm_res;
  }
}
module.exports = KSM;
