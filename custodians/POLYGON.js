const POLYGON_ALLOWED_ACTIONS = require("../config/custodians_specific_params/POLYGON_ALLOWED_ACTIONS.JS");
const TanganyParams = require("../config/tangany_params");
const sleep = require("../utils/sleep");
require("dotenv").config();

class POLYGON extends TanganyParams {
  constructor() {
    super();
    const env = process.env;
    this.polygon_access_key = this.polygon_access_key;
  }
  async do_polygon_request(url, page = 0) {
    let txlist_params = this.get_polygon_params(page, "txlist");
    let tokentx_params = this.get_polygon_params(page, "tokentx");
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
      if (!res.result?.length) {
        continue;
      }
    }

    return all_res;
  }
  async polygon_request(url, from_date, to_date, requests_addresses) {
    let all_res = await this.do_polygon_request(url);
    let oldest_txlist_mvt =
      parseInt(all_res["txlist"][all_res["txlist"].length - 1]?.timeStamp) *
      1000;

    let oldest_tokentx_mvt =
      parseInt(all_res["tokentx"][all_res["tokentx"].length - 1]?.timeStamp) *
      1000;
    let request_counter = 1;
    while (
      !this.date_is_earlier_than_today(oldest_txlist_mvt) ||
      !this.date_is_earlier_than_today(oldest_tokentx_mvt)
    ) {
      request_counter += 1;
      let polygon_res = await this.do_polygon_request(url, request_counter);
      all_res["tokentx"] = [...all_res["tokentx"], ...polygon_res["tokentx"]];

      all_res["txlist"] = [...all_res["txlist"], ...polygon_res["txlist"]];

      oldest_txlist_mvt =
        parseInt(
          polygon_res["txlist"][polygon_res["txlist"].length - 1]?.timeStamp
        ) * 1000;
      if (isNaN(oldest_txlist_mvt) && isNaN(oldest_tokentx_mvt)) {
        break;
      }
      oldest_tokentx_mvt =
        parseInt(
          polygon_res["tokentx"][polygon_res["tokentx"].length - 1]?.timeStamp
        ) * 1000;
    }
    let data_to_return = {};
    Object.keys(all_res).map((action) => {
      return (data_to_return[action] = all_res[action].filter(
        (element) =>
          !this.date_is_earlier_than_today(
            new Date(parseInt(element["timeStamp"]) * 1000)
          )
      ));
    });

    return data_to_return;
  }
}
module.exports = POLYGON;
