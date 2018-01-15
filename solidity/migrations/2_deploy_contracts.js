/* global artifacts */
/* eslint-disable prefer-reflect */

const Utils = artifacts.require('Utils.sol');
const Owned = artifacts.require('Owned.sol');
const Managed = artifacts.require('Managed.sol');
const TokenHolder = artifacts.require('TokenHolder.sol');
const ERC20Token = artifacts.require('ERC20Token.sol');
const EtherToken = artifacts.require('EtherToken.sol');
const SophonToken = artifacts.require('SophonToken.sol');
const SophonTokenController = artifacts.require('SophonTokenController.sol');
const SophonFormula = artifacts.require('SophonFormula.sol');
const SophonGasPriceLimit = artifacts.require('SophonGasPriceLimit.sol');
const SophonQuickConverter = artifacts.require('SophonQuickConverter.sol');
const SophonConverterExtensions = artifacts.require('SophonConverterExtensions.sol');
const SophonConverter = artifacts.require('SophonConverter.sol');
const CrowdsaleController = artifacts.require('CrowdsaleController.sol');

module.exports = async (deployer) => {
    deployer.deploy(Utils);
    deployer.deploy(Owned);
    deployer.deploy(Managed);
    deployer.deploy(TokenHolder);
    deployer.deploy(ERC20Token, 'DummyToken', 'DUM', 0);
    deployer.deploy(EtherToken);
    await deployer.deploy(SophonToken, 'Token1', 'TKN1', 2);
    deployer.deploy(SophonTokenController, SophonToken.address);
    deployer.deploy(SophonFormula);
    deployer.deploy(SophonGasPriceLimit, '22000000000');
    deployer.deploy(SophonQuickConverter);
    deployer.deploy(SophonConverterExtensions, '0x125463', '0x145463', '0x125763');
    deployer.deploy(SophonConverter, SophonToken.address, '0x124', 0, '0x0', 0);
    deployer.deploy(CrowdsaleController, SophonToken.address, 4102444800, '0x125', 1);
};
