/* global artifacts, contract, before, it, assert, web3 */
/* eslint-disable prefer-reflect */

const DistributionController = artifacts.require('DistributionController.sol');
const SophonToken = artifacts.require('SophonToken.sol');
const TestDistributionController = artifacts.require('TestDistributionController.sol');
const utils = require('./helpers/Utils');

let token;
let tokenAddress;
let beneficiaryAddress = '0x69aa30b306805bd17488ce957d03e3c0213ee9e6';
let startTime = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // distribution hasn't started
let startTimeInProgress = Math.floor(Date.now() / 1000) - 12 * 60 * 60; // ongoing distribution
let startTimeFinished = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // ongoing distribution
let realCap = 1000;
let realCapLarge = 1000000000000000000000000000000000000;
let realCapKey = 234;
let realEtherCapHash = '0xd3a40f1165164f13f237cc938419cc292e66b7bb3aa190f21087a3813c5ae1ca';  // sha3(uint256(1000), uint256(234))
let realEtherCapHashLarge = '0xe8de42a704eab00275ed4cdc7e4e626633a0ce70bc986007a037e3ff699f4381';  // sha3(uint256(1000000000000000000000000000000000000), uint256(234))
let badContributionGasPrice = 100000000001;

async function generateDefaultController() {
    return await DistributionController.new(tokenAddress, startTime, beneficiaryAddress, realEtherCapHash);
}

// used by contribution tests, creates a controller that's already in progress
async function initController(accounts, activate, startTimeOverride = startTimeInProgress) {
    token = await SophonToken.new('Sophon', 'SSS', 2);
    tokenAddress = token.address;

    let controller = await TestDistributionController.new(tokenAddress, startTime, beneficiaryAddress, realEtherCapHash, startTimeOverride);
    let controllerAddress = controller.address;

    if (activate) {
        await token.transferOwnership(controllerAddress);
        await controller.acceptTokenOwnership();
    }

    return controller;
}

function getContributionAmount(transaction, logIndex = 0) {
    return transaction.logs[logIndex].args._return.toNumber();
}

contract('DistributionController', (accounts) => {
    before(async () => {
        let token = await SophonToken.new('Sophon', 'SSS', 2);
        tokenAddress = token.address;
    });

    it('verifies the base storage values after construction', async () => {
        let controller = await generateDefaultController();
        let token = await controller.token.call();
        assert.equal(token, tokenAddress);
        let start = await controller.startTime.call();
        assert.equal(start.toNumber(), startTime);
        let endTime = await controller.endTime.call();
        let duration = await controller.DURATION.call();
        assert.equal(endTime.toNumber(), startTime + duration.toNumber());
        let beneficiary = await controller.beneficiary.call();
        assert.equal(beneficiary, beneficiaryAddress);
        let realCapHash = await controller.realEtherCapHash.call();
        assert.equal(realCapHash, realEtherCapHash);
    });

    it('should throw when attempting to construct a controller with no token', async () => {
        try {
            await DistributionController.new('0x0', startTime, beneficiaryAddress, realEtherCapHash);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to construct a controller with start time that has already passed', async () => {
        try {
            await DistributionController.new(tokenAddress, 10000000, beneficiaryAddress, realEtherCapHash);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to construct a controller without beneficiary address', async () => {
        try {
            await DistributionController.new(tokenAddress, startTime, '0x0', realEtherCapHash);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to construct a controller without ether cap hash', async () => {
        try {
            await DistributionController.new(tokenAddress, startTime, beneficiaryAddress, 0);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('verifies the real ether cap balance after enabled by the owner', async () => {
        let controller = await initController(accounts, true);
        await controller.enableRealCap(realCap, realCapKey);
        let totalEtherCap = await controller.totalEtherCap.call();
        assert.equal(totalEtherCap, realCap);
    });

    it('should throw when a non owner attempts to enable the real ether cap', async () => {
        let controller = await initController(accounts, true);

        try {
            await controller.enableRealCap(realCap, realCapKey, { from: accounts[1] });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to enable the real ether cap while the controller is not active', async () => {
        let controller = await initController(accounts, false);

        try {
            await controller.enableRealCap(realCap, realCapKey);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to enable the real ether cap before the start time', async () => {
        let controller = await initController(accounts, true, startTime);

        try {
            await controller.enableRealCap(realCap, realCapKey);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to enable the real ether cap with an invalid cap', async () => {
        let controller = await initController(accounts, true);

        try {
            await controller.enableRealCap(0, realCapKey);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to enable the real ether cap with the wrong real cap', async () => {
        let controller = await initController(accounts, true);

        try {
            await controller.enableRealCap(1001, realCapKey);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to enable the real ether cap with the wrong cap key', async () => {
        let controller = await initController(accounts, true);

        try {
            await controller.enableRealCap(realCap, 235);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when the owner attempts to enable the real ether cap with a value larger than the initial cap', async () => {
        let controller = await DistributionController.new(tokenAddress, startTime, beneficiaryAddress, realEtherCapHashLarge);

        try {
            await controller.enableRealCap(realCapLarge, realCapKey);
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('verifies that computeReturn returns a valid amount', async () => {
        let controller = await initController(accounts, true);
        let returnAmount = await controller.computeReturn.call(500);
        assert.isNumber(returnAmount.toNumber());
        assert.notEqual(returnAmount.toNumber(), 0);
    });

    it('verifies that computeReturn returns the same amount as contributeETH', async () => {
        let controller = await initController(accounts, true);
        let returnAmount = await controller.computeReturn.call(500);

        let purchaseRes = await controller.contributeETH({ value: 500 });
        let purchaseAmount = getContributionAmount(purchaseRes);

        assert.equal(returnAmount, purchaseAmount);
    });

    it('verifies balances and total eth contributed after contributing ether', async () => {
        let controller = await initController(accounts, true);

        let prevEtherBalance = await web3.eth.getBalance(beneficiaryAddress);

        let res = await controller.contributeETH({ value: 200, from: accounts[1] });
        let purchaseAmount = getContributionAmount(res);
        assert.isNumber(purchaseAmount);
        assert.notEqual(purchaseAmount, 0);

        let contributorTokenBalance = await token.balanceOf.call(accounts[1]);
        assert.equal(contributorTokenBalance, purchaseAmount);

        let beneficiaryTokenBalance = await token.balanceOf.call(beneficiaryAddress);
        assert.equal(beneficiaryTokenBalance, purchaseAmount);

        let beneficiaryEtherBalance = await web3.eth.getBalance(beneficiaryAddress);
        assert.equal(beneficiaryEtherBalance.toNumber(), prevEtherBalance.plus(200).toNumber());

        let totalEtherContributed = await controller.totalEtherContributed.call();
        assert.equal(totalEtherContributed, 200);
    });

    it('should throw when attempting to contribute ether while the controller is not active', async () => {
        let controller = await initController(accounts, false);

        try {
            await controller.contributeETH({ value: 2000 });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to contribute ether before the distribution has started', async () => {
        let controller = await initController(accounts, true, startTime);

        try {
            await controller.contributeETH({ value: 2000 });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to contribute ether after the distribution has finished', async () => {
        let controller = await initController(accounts, true, startTimeFinished);

        try {
            await controller.contributeETH({ value: 2000 });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to contribute ether while hitting the real ether cap', async () => {
        let controller = await initController(accounts, true);
        await controller.enableRealCap(realCap, realCapKey);

        try {
            await controller.contributeETH({ value: realCap + 1 });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });

    it('should throw when attempting to contribute ether with a large gas price', async () => {
        let controller = await initController(accounts, true);

        try {
            await controller.contributeETH({ value: 2000, gasPrice: badContributionGasPrice });
            assert(false, "didn't throw");
        }
        catch (error) {
            return utils.ensureException(error);
        }
    });
});

