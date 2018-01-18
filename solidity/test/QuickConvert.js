/* global artifacts, contract, before, it, assert, web3 */
/* eslint-disable prefer-reflect */

const SophonConverter = artifacts.require('SophonConverter.sol');
const SophonToken = artifacts.require('SophonToken.sol');
const SophonFormula = artifacts.require('SophonFormula.sol');
const SophonGasPriceLimit = artifacts.require('SophonGasPriceLimit.sol');
const SophonQuickConverter = artifacts.require('SophonQuickConverter.sol');
const SophonConverterExtensions = artifacts.require('SophonConverterExtensions.sol');
const EtherToken = artifacts.require('EtherToken.sol');
const TestERC20Token = artifacts.require('TestERC20Token.sol');
const utils = require('./helpers/Utils');

let etherToken;
let sophonSophon;
let sophonToken2;
let sophonToken3;
let sophonToken4;
let erc20Token;
let converterExtensionsAddress;
let converter1;
let converter2;
let converter3;
let converter4;
let sophonSophonQuickBuyPath;
let sophonToken2QuickBuyPath;
let sophonToken3QuickBuyPath;
let sophonToken4QuickBuyPath;
let erc20QuickBuyPath;
let sophonSophonQuickSellPath;
let sophonToken2QuickSellPath;

/*
Token network structure:

         SophonToken2
         /         \
    SophonSophon   SophonToken3
          \          \
           \        SophonToken4
            \        /      \
            EtherToken     ERC20Token

*/

contract('SophonConverter', (accounts) => {
    before(async () => {
        let formula = await SophonFormula.new();
        let gasPriceLimit = await SophonGasPriceLimit.new(22000000000);
        let quickConverter = await SophonQuickConverter.new();
        let converterExtensions = await SophonConverterExtensions.new(formula.address, gasPriceLimit.address, quickConverter.address);
        converterExtensionsAddress = converterExtensions.address;

        etherToken = await EtherToken.new();
        await etherToken.deposit({ value: 10000000 });

        await quickConverter.registerEtherToken(etherToken.address, true);

        sophonSophon = await SophonToken.new('Sophon', 'SSS', 2);
        await sophonSophon.issue(accounts[0], 1000000);

        sophonToken2 = await SophonToken.new('Token2', 'TKN2', 2);
        await sophonToken2.issue(accounts[0], 2000000);

        sophonToken3 = await SophonToken.new('Token3', 'TKN3', 2);
        await sophonToken3.issue(accounts[0], 3000000);

        sophonToken4 = await SophonToken.new('Token4', 'TKN4', 2);
        await sophonToken4.issue(accounts[0], 2500000);

        erc20Token = await TestERC20Token.new('ERC20Token', 'ERC5', 1000000);

        converter1 = await SophonConverter.new(sophonSophon.address, converterExtensionsAddress, 0, etherToken.address, 250000);
        converter1.address = converter1.address;

        converter2 = await SophonConverter.new(sophonToken2.address, converterExtensionsAddress, 0, sophonSophon.address, 300000);
        converter2.address = converter2.address;
        await converter2.addConnector(sophonToken3.address, 150000, false);

        converter3 = await SophonConverter.new(sophonToken3.address, converterExtensionsAddress, 0, sophonToken4.address, 350000);
        converter3.address = converter3.address;

        converter4 = await SophonConverter.new(sophonToken4.address, converterExtensionsAddress, 0, etherToken.address, 150000);
        converter4.address = converter4.address;
        await converter4.addConnector(erc20Token.address, 220000, false);

        await etherToken.transfer(converter1.address, 50000);
        await sophonSophon.transfer(converter2.address, 40000);
        await sophonToken3.transfer(converter2.address, 25000);
        await sophonToken4.transfer(converter3.address, 30000);
        await etherToken.transfer(converter4.address, 20000);
        await erc20Token.transfer(converter4.address, 35000);

        await sophonSophon.transferOwnership(converter1.address);
        await converter1.acceptTokenOwnership();

        await sophonToken2.transferOwnership(converter2.address);
        await converter2.acceptTokenOwnership();

        await sophonToken3.transferOwnership(converter3.address);
        await converter3.acceptTokenOwnership();

        await sophonToken4.transferOwnership(converter4.address);
        await converter4.acceptTokenOwnership();

        sophonSophonQuickBuyPath = [etherToken.address, sophonSophon.address, sophonSophon.address];
        sophonToken2QuickBuyPath = [etherToken.address, sophonSophon.address, sophonSophon.address, sophonToken2.address, sophonToken2.address];
        sophonToken3QuickBuyPath = [etherToken.address, sophonToken4.address, sophonToken4.address, sophonToken3.address, sophonToken4.address];
        sophonToken4QuickBuyPath = [etherToken.address, sophonToken4.address, sophonToken4.address];
        erc20QuickBuyPath = [etherToken.address, sophonToken4.address, erc20Token.address];

        await converter1.setQuickBuyPath(sophonSophonQuickBuyPath);
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);
        await converter3.setQuickBuyPath(sophonToken3QuickBuyPath);
        await converter4.setQuickBuyPath(sophonToken4QuickBuyPath);

        sophonSophonQuickSellPath = [sophonSophon.address, sophonSophon.address, etherToken.address];
        sophonToken2QuickSellPath = [sophonToken2.address, sophonToken2.address, sophonSophon.address, sophonSophon.address, etherToken.address];
    });

    it('verifies that the owner can set the quick buy path', async () => {
        await converter1.setQuickBuyPath(sophonSophonQuickBuyPath);

        let quickBuyPathLength = await converter1.getQuickBuyPathLength.call();
        assert.equal(quickBuyPathLength, sophonSophonQuickBuyPath.length);
    });

    it('verifies that the owner can clear the quick buy path', async () => {
        await converter1.clearQuickBuyPath();

        let prevQuickBuyPathLength = await converter1.getQuickBuyPathLength.call();
        assert.equal(prevQuickBuyPathLength, 0);
    });

    it('verifies that the correct quick buy path length is returned', async () => {
        await converter1.clearQuickBuyPath();

        let prevQuickBuyPathLength = await converter1.getQuickBuyPathLength.call();
        assert.equal(prevQuickBuyPathLength, 0);

        await converter1.setQuickBuyPath(sophonSophonQuickBuyPath);
        let newQuickBuyPathLength = await converter1.getQuickBuyPathLength.call();
        assert.equal(newQuickBuyPathLength, sophonSophonQuickBuyPath.length);
    });

    it('verifies the quick buy path values after the owner sets one', async () => {
        await converter1.setQuickBuyPath(sophonSophonQuickBuyPath);

        let newQuickBuyPathLength = await converter1.getQuickBuyPathLength.call();
        assert.equal(newQuickBuyPathLength, sophonSophonQuickBuyPath.length);

        for (let i = 0; i < newQuickBuyPathLength; ++i) {
            let quickBuyPathElement = await converter1.quickBuyPath.call(i);
            assert.equal(quickBuyPathElement, sophonSophonQuickBuyPath[i]);
        }
    });

    it('should throw when a non owner attempts to set the quick buy path', async () => {
        try {
            await converter1.setQuickBuyPath(sophonSophonQuickBuyPath, { from: accounts[1] });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to set an invalid short quick buy path', async () => {
        try {
            await converter1.setQuickBuyPath([etherToken.address]);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to set an invalid long quick buy path', async () => {
        let longQuickBuyPath = [];
        for (let i = 0; i < 51; ++i)
            longQuickBuyPath.push(etherToken.address);

        try {
            await converter1.setQuickBuyPath(longQuickBuyPath);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to set a quick buy path with an invalid length', async () => {
        try {
            await converter1.setQuickBuyPath([etherToken.address, sophonSophon.address]);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when a non owner attempts to clear the quick buy path', async () => {
        try {
            await converter1.clearQuickBuyPath({ from: accounts[1] });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('verifies that quick buy with a single converter results in increased balance for the buyer', async () => {
        await converter1.setQuickBuyPath(sophonSophonQuickBuyPath);
        let prevBalance = await sophonSophon.balanceOf.call(accounts[1]);

        await converter1.quickConvert(sophonSophonQuickBuyPath, 100, 1, { from: accounts[1], value: 100 });
        let newBalance = await sophonSophon.balanceOf.call(accounts[1]);

        assert.isAbove(newBalance.toNumber(), prevBalance.toNumber(), "new balance isn't higher than previous balance");
    });

    it('verifies that quick buy with multiple converters results in increased balance for the buyer', async () => {
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);
        let prevBalance = await sophonToken2.balanceOf.call(accounts[1]);

        await converter2.quickConvert(sophonToken2QuickBuyPath, 100, 1, { from: accounts[1], value: 100 });
        let newBalance = await sophonToken2.balanceOf.call(accounts[1]);

        assert.isAbove(newBalance.toNumber(), prevBalance.toNumber(), "new balance isn't higher than previous balance");
    });

    it('verifies that quick buy through the fallback function results in increased balance for the buyer', async () => {
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);
        let prevBalance = await sophonToken2.balanceOf.call(accounts[0]);

        await converter2.send(100);
        let newBalance = await sophonToken2.balanceOf.call(accounts[0]);

        assert.isAbove(newBalance.toNumber(), prevBalance.toNumber(), "new balance isn't higher than previous balance");
    });

    it('verifies that quick buy of an ERC20 token through the fallback function results in increased balance for the buyer', async () => {
        await converter4.setQuickBuyPath(erc20QuickBuyPath);
        let prevBalance = await erc20Token.balanceOf.call(accounts[0]);

        await converter4.send(100);
        let newBalance = await erc20Token.balanceOf.call(accounts[0]);

        assert.isAbove(newBalance.toNumber(), prevBalance.toNumber(), "new balance isn't higher than previous balance");
    });

    it('verifies that quick buy with minimum return equal to the full expected return amount results in the exact increase in balance for the buyer', async () => {
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);
        let prevBalance = await sophonToken2.balanceOf.call(accounts[0]);

        let token1Return = await converter1.getPurchaseReturn(etherToken.address, 100000);
        let token2Return = await converter2.getPurchaseReturn(sophonSophon.address, token1Return);

        await converter2.quickConvert(sophonToken2QuickBuyPath, 100000, token2Return, { value: 100000 });
        let newBalance = await sophonToken2.balanceOf.call(accounts[0]);

        assert.equal(token2Return.toNumber(), newBalance.toNumber() - prevBalance.toNumber(), "new balance isn't equal to the expected purchase return");
    });

    it('should throw when attempting to quick buy and the return amount is lower than the given minimum', async () => {
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);

        try {
            await converter2.quickConvert(sophonToken2QuickBuyPath, 100, 1000000, { from: accounts[1], value: 100 });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to quick buy and passing an amount higher than the ETH amount sent with the request', async () => {
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);

        try {
            await converter2.quickConvert(sophonToken2QuickBuyPath, 100001, 1, { from: accounts[1], value: 100000 });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('verifies the caller balances after selling directly for ether with a single converter', async () => {
        await converter1.setQuickBuyPath(sophonSophonQuickBuyPath);
        let prevETHBalance = web3.eth.getBalance(accounts[0]);
        let prevTokenBalance = await sophonSophon.balanceOf.call(accounts[0]);

        let res = await converter1.quickConvert(sophonSophonQuickSellPath, 10000, 1);
        let newETHBalance = web3.eth.getBalance(accounts[0]);
        let newTokenBalance = await sophonSophon.balanceOf.call(accounts[0]);

        let transaction = web3.eth.getTransaction(res.tx);
        let transactionCost = transaction.gasPrice.times(res.receipt.cumulativeGasUsed);
        assert(newETHBalance.greaterThan(prevETHBalance.minus(transactionCost)), "new ETH balance isn't higher than previous balance");
        assert(newTokenBalance.lessThan(prevTokenBalance), "new token balance isn't lower than previous balance");
    });

    it('verifies the caller balances after selling directly for ether with multiple converters', async () => {
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);
        let prevETHBalance = web3.eth.getBalance(accounts[0]);
        let prevTokenBalance = await sophonToken2.balanceOf.call(accounts[0]);

        let res = await converter2.quickConvert(sophonToken2QuickSellPath, 10000, 1);
        let newETHBalance = web3.eth.getBalance(accounts[0]);
        let newTokenBalance = await sophonToken2.balanceOf.call(accounts[0]);

        let transaction = web3.eth.getTransaction(res.tx);
        let transactionCost = transaction.gasPrice.times(res.receipt.cumulativeGasUsed);
        assert(newETHBalance.greaterThan(prevETHBalance.minus(transactionCost)), "new ETH balance isn't higher than previous balance");
        assert(newTokenBalance.lessThan(prevTokenBalance), "new token balance isn't lower than previous balance");
    });

    it('should throw when attempting to sell directly for ether and the return amount is lower than the given minimum', async () => {
        await converter2.setQuickBuyPath(sophonToken2QuickBuyPath);

        try {
            await converter2.quickConvert(sophonToken2QuickSellPath, 10000, 20000);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('verifies the caller balances after converting from one token to another with multiple converters', async () => {
        await converter1.setQuickBuyPath(sophonSophonQuickBuyPath);

        let path = [sophonSophon.address,
                    sophonToken2.address, sophonToken2.address,
                    sophonToken2.address, sophonToken3.address,
                    sophonToken3.address, sophonToken4.address];

        let prevSophonBalance = await sophonSophon.balanceOf.call(accounts[0]);
        let prevToken4Balance = await sophonToken4.balanceOf.call(accounts[0]);

        await converter1.quickConvert(path, 1000, 1);
        let newSophonBalance = await sophonSophon.balanceOf.call(accounts[0]);
        let newToken4Balance = await sophonToken4.balanceOf.call(accounts[0]);

        assert(newToken4Balance.greaterThan(prevToken4Balance), "bought token balance isn't higher than previous balance");
        assert(newSophonBalance.lessThan(prevSophonBalance), "sold token balance isn't lower than previous balance");
    });
});
