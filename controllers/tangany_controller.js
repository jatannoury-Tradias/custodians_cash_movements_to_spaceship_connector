const EOS = require("../custodians/EOS");
const Etherscan = require("../custodians/ETHERSCAN");
const HBAR = require("../custodians/HBAR");
const POLYGON = require("../custodians/POLYGON");
const SOL = require("../custodians/SOL");
const sleep = require("../utils/sleep");

class TanganyController  {
  constructor() {
    this.etherscan_instance = new Etherscan()
    this.eos_instance = new EOS()
    this.hbar_instance = new HBAR()
    this.sol_instance = new SOL()
    this.polygon_instance = new POLYGON()
  }
  
}
module.exports = TanganyController;
