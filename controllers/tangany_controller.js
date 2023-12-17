const CELO = require("../custodians/CELO");
const EOS = require("../custodians/EOS");
const Etherscan = require("../custodians/ETHERSCAN");
const FTM = require("../custodians/FTM");
const HBAR = require("../custodians/HBAR");
const KSM = require("../custodians/KSM");
const NEAR = require("../custodians/NEAR");
const OKLINK = require("../custodians/OKLINK");
const POLYGON = require("../custodians/POLYGON");
const SGB = require("../custodians/SGB");
const SOL = require("../custodians/SOL");
const XTZ = require("../custodians/XTZ");
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
    this.near_instance = new NEAR()
    this.celo_instance = new CELO()
    this.sgb_instance = new SGB()
    this.xtz_instance = new XTZ()
  }
  
}
module.exports = TanganyController;
