const fs = require("fs").promises;

async function get_local_data(data_name) {
  if (data_name === "prod_addresses") {
    const jsonFilePath =
      "C:/Users/jtannoury/Desktop/custodians_cash_movements_to_spaceship_connector/data/static_data/prod_addresses_response.json";

    try {
      const data = await fs.readFile(jsonFilePath, "utf8");
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (err) {
      console.error("Error reading or parsing JSON file:", err);
      throw err; // Re-throw the error to signal that something went wrong
    }
  }
}

module.exports = get_local_data;
