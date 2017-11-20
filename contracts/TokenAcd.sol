/* Augmint Crypto Dollar token (ACD) implementation */
pragma solidity ^0.4.18;
import "./AugmintToken.sol";


contract TokenAcd is AugmintToken {
    string public constant name = "Augmint Crypto Dollar";
    string public constant symbol = "ACD";
    uint8 public constant decimals = 4; // TODO: check if 4 enough - assuming rate will be around USD

    function TokenAcd(address _feeAccount, uint _transferFeeDiv, uint _transferFeeMin, uint _transferFeeMax) public {
        feeAccount = _feeAccount;
        transferFeeDiv = _transferFeeDiv;
        transferFeeMin = _transferFeeMin;
        transferFeeMax = _transferFeeMax;
    }
}
