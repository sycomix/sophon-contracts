pragma solidity ^0.4.11;
import './TokenHolder.sol';
import './interfaces/ISophonConverterExtensions.sol';

/**
    @dev the SophonConverterExtensions contract is an owned contract that serves as a single point of access
    to the SophonFormula, SophonGasPriceLimit and SophonQuickConverter contracts from all SophonConverter contract instances.
    it allows upgrading these contracts without the need to update each and every
    SophonConverter contract instance individually.
*/
contract SophonConverterExtensions is ISophonConverterExtensions, TokenHolder {
    ISophonFormula public formula;  // sophon calculation formula contract
    ISophonGasPriceLimit public gasPriceLimit; // sophon universal gas price limit contract
    ISophonQuickConverter public quickConverter; // sophon quick converter contract

    /**
        @dev constructor

        @param _formula         address of a sophon formula contract
        @param _gasPriceLimit   address of a sophon gas price limit contract
        @param _quickConverter  address of a sophon quick converter contract
    */
    function SophonConverterExtensions(ISophonFormula _formula, ISophonGasPriceLimit _gasPriceLimit, ISophonQuickConverter _quickConverter)
        validAddress(_formula)
        validAddress(_gasPriceLimit)
        validAddress(_quickConverter)
    {
        formula = _formula;
        gasPriceLimit = _gasPriceLimit;
        quickConverter = _quickConverter;
    }

    /*
        @dev allows the owner to update the formula contract address

        @param _formula    address of a sophon formula contract
    */
    function setFormula(ISophonFormula _formula)
        public
        ownerOnly
        validAddress(_formula)
        notThis(_formula)
    {
        formula = _formula;
    }

    /*
        @dev allows the owner to update the gas price limit contract address

        @param _gasPriceLimit   address of a sophon gas price limit contract
    */
    function setGasPriceLimit(ISophonGasPriceLimit _gasPriceLimit)
        public
        ownerOnly
        validAddress(_gasPriceLimit)
        notThis(_gasPriceLimit)
    {
        gasPriceLimit = _gasPriceLimit;
    }

    /*
        @dev allows the owner to update the quick converter contract address

        @param _quickConverter  address of a sophon quick converter contract
    */
    function setQuickConverter(ISophonQuickConverter _quickConverter)
        public
        ownerOnly
        validAddress(_quickConverter)
        notThis(_quickConverter)
    {
        quickConverter = _quickConverter;
    }
}
