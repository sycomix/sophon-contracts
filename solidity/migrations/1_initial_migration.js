/* global artifacts */

const Migrations = artifacts.require('Migrations.sol');
const SophonFormula = artifacts.require('SophonFormula.sol');

module.exports = (deployer) => {
    deployer.deploy(Migrations);
    deployer.deploy(SophonFormula);
};
