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

        uint256 validVotes;
        uint256 revokeVotes;
    }

    uint256 public disputeCount;

    mapping(uint256 => Dispute) public disputes;

    // track voting
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event DisputeRaised(
        uint256 disputeId,
        uint256 certificateId,
        address raisedBy,
        string reason
    );

    event VoteCast(
        uint256 disputeId,
        address voter,
        bool voteValid
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
            certificateValid: true,
            validVotes: 0,
            revokeVotes: 0
        });

        emit DisputeRaised(disputeCount, certificateId, msg.sender, reason);
    }

    function submitEvidence(uint256 disputeId, string memory ipfsHash) public {
        require(disputeId <= disputeCount, "Invalid dispute");

        disputes[disputeId].evidenceHash = ipfsHash;
    }

    function vote(uint256 disputeId, bool voteValid) public {

        require(disputeId <= disputeCount, "Invalid dispute");
        require(!disputes[disputeId].resolved, "Already resolved");
        require(!hasVoted[disputeId][msg.sender], "Already voted");

        hasVoted[disputeId][msg.sender] = true;

        if (voteValid) {
            disputes[disputeId].validVotes++;
        } else {
            disputes[disputeId].revokeVotes++;
        }

        emit VoteCast(disputeId, msg.sender, voteValid);

        // 🔥 Threshold = 2 votes
        if (disputes[disputeId].validVotes >= 2) {
            disputes[disputeId].resolved = true;
            disputes[disputeId].certificateValid = true;

            emit DisputeResolved(disputeId, true);
        }

        if (disputes[disputeId].revokeVotes >= 2) {
            disputes[disputeId].resolved = true;
            disputes[disputeId].certificateValid = false;

            emit DisputeResolved(disputeId, false);
        }
    }
}