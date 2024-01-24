var logger = require("tracer").console();

async function response_parser(response, ok_status, custodian) {
  if (response.status === ok_status) {
    logger.info(
      `FETCH: ${custodian} request successful with ${ok_status} status code`
    );
    return await response.json();
  } else {
    const responseBody = await response.text();
    logger.warn(
      `${custodian} request failed with ${response.status} status code`
    );
    logger.warn(`${custodian} request response ${responseBody}`);
    return undefined;
  }
}

module.exports = {
  response_parser,
};
