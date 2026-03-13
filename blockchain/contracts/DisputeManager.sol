// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DisputeManager {

    struct Dispute {
        uint256 certificateId;
        address raisedBy;
        string reason;
        string evidenceHash;
        bool resolved;
        bool certificateValid;
    }

    uint256 public disputeCount;

    mapping(uint256 => Dispute) public disputes;

    event DisputeRaised(
        uint256 disputeId,
        uint256 certificateId,
        address raisedBy,
        string reason
    );

    event EvidenceSubmitted(
        uint256 disputeId,
        string evidenceHash
    );

    event DisputeResolved(
        uint256 disputeId,
        bool certificateValid
    );

    function raiseDispute(uint256 certificateId, string memory reason) public {

        disputeCount++;

        disputes[disputeCount] = Dispute({
            certificateId: certificateId,
            raisedBy: msg.sender,
            reason: reason,
            evidenceHash: "",
            resolved: false,
            certificateValid: true
        });

        emit DisputeRaised(disputeCount, certificateId, msg.sender, reason);
    }

    function submitEvidence(uint256 disputeId, string memory ipfsHash) public {

        require(disputeId <= disputeCount, "Invalid dispute");

        disputes[disputeId].evidenceHash = ipfsHash;

        emit EvidenceSubmitted(disputeId, ipfsHash);
    }

    function resolveDispute(uint256 disputeId, bool certificateValid) public {

        require(disputeId <= disputeCount, "Invalid dispute");

        disputes[disputeId].resolved = true;
        disputes[disputeId].certificateValid = certificateValid;

        emit DisputeResolved(disputeId, certificateValid);
    }
}