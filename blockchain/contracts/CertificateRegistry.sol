// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateRegistry {
    struct Certificate {
        address issuer;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Certificate) private certificates;

    event CertificateIssued(bytes32 hash, address issuer);

    function issueCertificate(bytes32 _hash) external {
        require(!certificates[_hash].exists, "Already issued");

        certificates[_hash] = Certificate(
            msg.sender,
            block.timestamp,
            true
        );

        emit CertificateIssued(_hash, msg.sender);
    }

    function verifyCertificate(bytes32 _hash)
        external
        view
        returns (bool, address, uint256)
    {
        Certificate memory cert = certificates[_hash];
        return (cert.exists, cert.issuer, cert.timestamp);
    }
}
