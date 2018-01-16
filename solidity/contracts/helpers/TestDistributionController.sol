pragma solidity ^0.4.11;
import '../DistributionController.sol';

/*
    Test distribution controller with start time < now < end time
*/
contract TestDistributionController is DistributionController {
    function TestDistributionController(
        ISophonToken _token,
        uint256 _startTime,
        address _beneficiary,
        bytes32 _realEtherCapHash,
        uint256 _startTimeOverride)
        DistributionController(_token, _startTime, _beneficiary, _realEtherCapHash)
    {
        startTime = _startTimeOverride;
        endTime = startTime + DURATION;
    }
}
