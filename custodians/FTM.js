const FTM_ALLOWED_ACTIONS = require("../config/custodians_specific_params/FTM_ALLOWED_ACTIONS.JS");
const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");
require("dotenv").config();

class FTM extends TanganyParams {
  constructor() {
    super();
    const env = process.env;
  }
  async do_ftm_request(url, from = 0) {
    let txlist_params = this.get_ftm_params(from, "txlist");
    let tokentx_params = this.get_ftm_params(from, "tokentx");
    let all_res = {};
    for (const param of [...tokentx_params, ...txlist_params]) {
      console.log(param);
      const request_url = this.json_to_query_params(url, param);
      const res = await fetch(request_url, {
        method: "GET",
      })
        .then(async (res) => {
          return await res.json();
        })
        .catch((e) => {
          console.log(e);
        });
      if (Object.keys(all_res).includes(param["action"])) {
        all_res[param["action"]] = [
          ...all_res[param["action"]],
          ...(res?.result || []),
        ];
      } else {
        all_res[param["action"]] = [...(res?.result || [])];
      }
      if (res.result.length === 0) {
        continue;
      }
      while (
        !this.date_is_earlier_than_today(
          new Date(
            parseInt(
              all_res[param["action"]][all_res[param["action"]].length - 1]
                ?.timeStamp
            ) * 1000
          )
        )
      ) {
        let from = all_res[param["action"]].length;
        let ftm_res = await this.do_ftm_request(url, param, from);
        all_res[param["action"]] = ftm_res?.result
          ? [...ftm_res, ...all_res[param["action"]]]
          : all_res[param["action"]];
      }
    }

    return all_res;
  }
  async ftm_request(url, from_date, to_date, requests_addresses) {
    let ftm_res = await this.do_ftm_request(url);
    ftm_res = Object.keys(ftm_res).map((action) => {
      return ftm_res[action].filter(
        (element) =>
          !this.date_is_earlier_than_today(
            new Date(parseInt(element["timeStamp"]) * 1000)
          )
      );
    });

    return ftm_res;
  }
}
module.exports = FTM;
