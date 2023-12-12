const EOS = require("../custodians/EOS");
const Etherscan = require("../custodians/ETHERSCAN");
const FTM = require("../custodians/FTM");
const HBAR = require("../custodians/HBAR");
const KSM = require("../custodians/KSM");
const OKLINK = require("../custodians/OKLINK");
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
    this.ftm_instance = new FTM()
    this.ksm_instance = new KSM()
    this.oklink_instance = new OKLINK()
  }
  
}
module.exports = TanganyController;
