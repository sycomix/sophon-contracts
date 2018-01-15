pragma solidity ^0.4.11;
import './ISophonFormula.sol';
import './ISophonGasPriceLimit.sol';
import './ISophonQuickConverter.sol';

/*
    Sophon Converter Extensions interface
*/
contract ISophonConverterExtensions {
    function formula() public constant returns (ISophonFormula) {}
    function gasPriceLimit() public constant returns (ISophonGasPriceLimit) {}
    function quickConverter() public constant returns (ISophonQuickConverter) {}
}
