const TanganyParams = require("../config/tangany_params");
const {
  get_curr_day_to_curr_plus_one_midnight_date,
} = require("../utils/date_utils");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");
require("dotenv").config();

class SGB extends TanganyParams {
  constructor() {
    super();
  }
  async do_sgb_request(url, address) {
    return await fetch(url, {
      headers: this.sgb_headers,
    }).then(
      async (res) =>
        await response_parser(res, 200, `SGB for address ${address}`)
    );
  }
  async sgb_request(url, from_date, to_date, requests_addresses) {
    let all_sgb_requests = { txlist: [] };
    for (let address of requests_addresses.covalent_sgb) {
      let page = 0;
      let request_url = this.json_to_query_params(
        `${url}/address/${address}/transactions_v2/?`,
        this.get_sgb_params(page)
      );
      let res = await this.do_sgb_request(request_url, address);
      all_sgb_requests.txlist = [...res.data.items, ...all_sgb_requests.txlist];
      while (
        res.data.items.length !== 0 &&
        !this.date_is_earlier_than_from_date(
          all_sgb_requests.txlist[all_sgb_requests.txlist.length - 1][
            "block_signed_at"
          ],
          from_date
        )
      ) {
        page += 1;
        request_url = this.json_to_query_params(
          `${url}/address/${address}/transactions_v2/?`,
          this.get_sgb_params(page)
        );
        const res = await this.do_sgb_request(request_url, address);
        if (res.data.pagination.has_more === false) {
          all_sgb_requests.txlist = [
            ...all_sgb_requests.txlist,
            ...res.data.items,
          ];
          break;
        }
      }
      await sleep(this.mapped_timeouts.covalent_sgb);
    }

    return all_sgb_requests.txlist.filter((element) =>
      this.date_is_between_input_dates(
        element["block_signed_at"],
        from_date,
        to_date
      )
    );
  }
}
module.exports = SGB;
