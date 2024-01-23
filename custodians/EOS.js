const TanganyParams = require("../config/tangany_params");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");

class EOS extends TanganyParams {
  constructor() {
    super();
  }

  async do_eos_request(url, position = null, address) {
    let params = this.get_eos_params(position, address);

    return await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
    }).then(async (res) => {
      return await response_parser(res, 200, `EOS for address ${address}`).then(
        (res) => res.actions
      );
    });
  }
  async eos_request(url, from_date = null, to_date = null, requests_addresses) {
    let all_eos_data = [];
    for (let address of requests_addresses.eos) {
      all_eos_data = [
        ...(await this.do_eos_request(url, -1, address)),
        ...all_eos_data,
      ];
      // Pagination
      while (
        all_eos_data.length > 0 &&
        !this.date_is_earlier_than_from_date(
          all_eos_data[0]["block_time"],
          from_date
        )
      ) {
        let eos_request = await this.do_eos_request(
          url,
          all_eos_data[0].account_action_seq,
          address
        );
        if (eos_request.length === 0) {
          break;
        }
        all_eos_data = [...eos_request, ...all_eos_data];
      }
      all_eos_data = all_eos_data.filter((element) =>
        this.date_is_between_input_dates(
          element["block_time"],
          from_date,
          to_date
        )
      );
      await sleep(this.mapped_timeouts.eos);
    }

    return all_eos_data.filter((element) =>
      this.date_is_between_input_dates(element.block_time, from_date, to_date)
    );
  }
}
module.exports = EOS;
