// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    A very small Solidity contract for storing transaction hashes.
    This simulates immutable logging for the AML project.
*/
contract AMLTransactionLogger {
    struct TransactionRecord {
        string transactionId;
        string hashValue;
        uint256 timestamp;
    }

    TransactionRecord[] public records;

    event TransactionLogged(string transactionId, string hashValue, uint256 timestamp);

    function logTransaction(string memory transactionId, string memory hashValue) public {
        TransactionRecord memory record = TransactionRecord({
            transactionId: transactionId,
            hashValue: hashValue,
            timestamp: block.timestamp
        });

        records.push(record);
        emit TransactionLogged(transactionId, hashValue, block.timestamp);
    }

    function getRecordCount() public view returns (uint256) {
        return records.length;
    }
}
