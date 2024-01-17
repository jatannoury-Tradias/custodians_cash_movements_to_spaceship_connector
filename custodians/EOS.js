const TanganyParams = require("../config/tangany_params");
const { response_parser } = require("../utils/response_parser");
const sleep = require("../utils/sleep");

class EOS extends TanganyParams {
  constructor() {
    super();
  }

  async do_eos_request(url, position = null) {
    let params = this.get_eos_params(position);

    return await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
    }).then(async (res) => {
      return await response_parser(res, 200, "EOS");
    });
  }
  async eos_request(url, from_date = null, to_date = null) {
    let pos = -1;
    let all_eos_data = await this.do_eos_request(url, -1).then((res) => {
      return res["actions"];
    });
    // Pagination
    while (
      all_eos_data.length > 0 &&
      !this.date_is_earlier_than_from_date(
        all_eos_data[0]["block_time"],
        from_date
      )
    ) {
      pos -= 100;
      let eos_request = await this.do_eos_request(url, pos);
      all_eos_data = [...eos_request.actions, ...all_eos_data];
    }
    all_eos_data = all_eos_data.filter((element) =>
      this.date_is_between_input_dates(
        element["block_time"],
        from_date,
        to_date
      )
    );
    return { txlist: all_eos_data };
  }
}
module.exports = EOS;
