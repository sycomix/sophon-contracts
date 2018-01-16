pragma solidity ^0.4.11;
import './TokenHolder.sol';
import './Owned.sol';
import './Utils.sol';
import './interfaces/ISophonToken.sol';

/*
    SophonPriceFloor v0.1

    The sophon price floor contract is a simple contract that allows selling sophon tokens for a constant ETH price

    'Owned' is specified here for readability reasons
*/
contract SophonPriceFloor is Owned, TokenHolder {
    uint256 public constant TOKEN_PRICE_N = 1;      // distribution price in wei (numerator)
    uint256 public constant TOKEN_PRICE_D = 100;    // distribution price in wei (denominator)

    string public version = '0.1';
    ISophonToken public token; // sophon token the contract allows selling

    /**
        @dev constructor

        @param _token   sophon token the contract allows selling
    */
    function SophonPriceFloor(ISophonToken _token)
        validAddress(_token)
    {
        token = _token;
    }

    /**
        @dev sells the sophon token for ETH
        note that the function will sell the full allowance amount

        @return ETH sent in return
    */
    function sell() public returns (uint256 amount) {
        uint256 allowance = token.allowance(msg.sender, this); // get the full allowance amount
        assert(token.transferFrom(msg.sender, this, allowance)); // transfer all tokens from the sender to the contract
        uint256 etherValue = safeMul(allowance, TOKEN_PRICE_N) / TOKEN_PRICE_D; // calculate ETH value of the tokens
        msg.sender.transfer(etherValue); // send the ETH amount to the seller
        return etherValue;
    }

    /**
        @dev withdraws ETH from the contract

        @param _amount  amount of ETH to withdraw
    */
    function withdraw(uint256 _amount) public ownerOnly {
        msg.sender.transfer(_amount); // send the amount
    }

    /**
        @dev deposits ETH in the contract
    */
    function() public payable {
    }
}
