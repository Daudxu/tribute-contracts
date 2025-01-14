// Whole-script strict mode syntax
"use strict";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
const { MerkleTree } = require("./merkle-tree-util");
const { sha3, toBNWeb3 } = require("./contract-util");
const sigUtil = require("eth-sig-util");

const BadNodeError = {
  0: "OK",
  1: "WRONG_PROPOSAL_ID",
  2: "INVALID_CHOICE",
  3: "AFTER_VOTING_PERIOD",
  4: "BAD_SIGNATURE",
  5: "INDEX_OUT_OF_BOUND",
  6: "VOTE_NOT_ALLOWED",
};

const VotingState = {
  0: "NOT_STARTED",
  1: "TIE",
  2: "PASS",
  3: "NOT_PASS",
  4: "IN_PROGRESS",
  5: "GRACE_PERIOD",
};

function getMessageERC712Hash(m, verifyingContract, actionId, chainId) {
  const message = prepareMessage(m);
  const { domain, types } = getDomainDefinition(
    m,
    verifyingContract,
    actionId,
    chainId
  );
  const msgParams = {
    domain,
    message,
    primaryType: "Message",
    types,
  };
  return "0x" + sigUtil.TypedDataUtils.sign(msgParams).toString("hex");
}

function getDomainDefinition(message, verifyingContract, actionId, chainId) {
  switch (message.type) {
    case "vote":
      return getVoteDomainDefinition(verifyingContract, actionId, chainId);
    case "proposal":
      return getProposalDomainDefinition(verifyingContract, actionId, chainId);
    case "draft":
      return getDraftDomainDefinition(verifyingContract, actionId, chainId);
    case "result":
      return getVoteResultRootDomainDefinition(
        verifyingContract,
        actionId,
        chainId
      );
    case "coupon":
      return getCouponDomainDefinition(verifyingContract, actionId, chainId);
    case "coupon-kyc":
      return getCouponKycDomainDefinition(verifyingContract, actionId, chainId);
    case "manager":
      return getManagerDomainDefinition(verifyingContract, actionId, chainId);
    default:
      throw new Error("unknown type '" + message.type + "'");
  }
}

function getManagerDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "daoAddress", type: "address" },
      { name: "proposal", type: "ProposalDetails" },
      { name: "configs", type: "Configuration[]" },
      { name: "nonce", type: "uint256" },
    ],
    ProposalDetails: [
      { name: "adapterOrExtensionId", type: "bytes32" },
      { name: "adapterOrExtensionAddr", type: "address" },
      { name: "updateType", type: "uint8" },
      { name: "flags", type: "uint128" },
      { name: "keys", type: "bytes32[]" },
      { name: "values", type: "uint256[]" },
      { name: "extensionAddresses", type: "address[]" },
      { name: "extensionAclFlags", type: "uint128[]" },
    ],
    Configuration: [
      { name: "key", type: "bytes32" },
      { name: "numericValue", type: "uint256" },
      { name: "addressValue", type: "address" },
      { name: "configType", type: "uint8" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getCouponKycDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "kycedMember", type: "address" },
      { name: "memberNonce", type: "uint256" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getMessageDomainType(chainId, verifyingContract, actionId) {
  return {
    name: "Snapshot Message",
    version: "4",
    chainId,
    verifyingContract,
    actionId,
  };
}

function getVoteDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "choice", type: "uint32" },
      { name: "proposalId", type: "bytes32" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getVoteStepDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  // The named list of all type definitions
  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "nbYes", type: "uint88" },
      { name: "nbNo", type: "uint88" },
      { name: "index", type: "uint32" },
      { name: "choice", type: "uint32" },
      { name: "proposalId", type: "bytes32" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getProposalDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "spaceHash", type: "bytes32" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "nameHash", type: "bytes32" },
      { name: "bodyHash", type: "bytes32" },
      { name: "choices", type: "string[]" },
      { name: "start", type: "uint64" },
      { name: "end", type: "uint64" },
      { name: "snapshot", type: "string" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getDraftDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "timestamp", type: "uint64" },
      { name: "spaceHash", type: "bytes32" },
      { name: "payload", type: "MessagePayload" },
    ],
    MessagePayload: [
      { name: "nameHash", type: "bytes32" },
      { name: "bodyHash", type: "bytes32" },
      { name: "choices", type: "string[]" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getVoteResultRootDomainDefinition(
  verifyingContract,
  actionId,
  chainId
) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [{ name: "root", type: "bytes32" }],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getCouponDomainDefinition(verifyingContract, actionId, chainId) {
  const domain = getMessageDomainType(chainId, verifyingContract, actionId);

  const types = {
    Message: [
      { name: "authorizedMember", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
    EIP712Domain: getDomainType(),
  };

  return { domain, types };
}

function getDomainType() {
  return [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
    { name: "actionId", type: "address" },
  ];
}

async function signMessage(signer, message, verifyingContract, chainId) {
  return signer(message, verifyingContract, chainId);
}

function validateMessage(
  message,
  address,
  verifyingContract,
  actionId,
  chainId,
  signature
) {
  const { domain, types } = getDomainDefinition(
    message,
    verifyingContract,
    actionId,
    chainId
  );

  const msgParams = {
    domain,
    message,
    primaryType: "Message",
    types,
  };

  const recoverAddress = sigUtil.recoverTypedSignature_v4({
    data: msgParams,
    sig: signature,
  });
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3JsSigner(web3, account) {
  return async function (m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    const { domain, types } = getDomainDefinition(
      message,
      verifyingContract,
      actionId,
      chainId
    );
    const msgParams = JSON.stringify({
      domain,
      message,
      primaryType: "Message",
      types,
    });
    const signature = await new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          method: "eth_signTypedData_v4",
          params: [msgParams, account],
          from: account,
        },
        function (err, result) {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    });

    return signature;
  };
}

function Web3Signer(ethers, account) {
  return function (m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    const { domain, types } = getDomainDefinition(
      message,
      verifyingContract,
      actionId,
      chainId
    );
    const signer = ethers.getSigner(account);
    return signer._signTypedData(domain, types, message);
  };
}

function SigUtilSigner(privateKeyStr) {
  return function (m, verifyingContract, actionId, chainId) {
    const message = prepareMessage(m);
    if (privateKeyStr.indexOf("0x") === 0) {
      privateKeyStr = privateKeyStr.slice(2);
    }
    const privateKey = Buffer.from(privateKeyStr, "hex");
    const { domain, types } = getDomainDefinition(
      message,
      verifyingContract,
      actionId,
      chainId
    );
    const msgParams = {
      domain,
      message,
      primaryType: "Message",
      types,
    };
    return sigUtil.signTypedData_v4(privateKey, { data: msgParams });
  };
}

function prepareMessage(message) {
  switch (message.type) {
    case "vote":
      return prepareVoteMessage(message);
    case "proposal":
      return prepareProposalMessage(message);
    case "result":
      return message;
    case "coupon":
      return message;
    case "coupon-kyc":
      return message;
    case "manager":
      return message;
    default:
      throw new Error("unknown type " + message.type);
  }
}

function prepareVoteMessage(message) {
  return Object.assign(message, {
    timestamp: message.timestamp,
    payload: prepareVotePayload(message.payload),
  });
}

function prepareVotePayload(payload) {
  return Object.assign(payload, {
    proposalId: payload.proposalId,
    choice: payload.choice,
  });
}

function prepareProposalMessage(message) {
  return Object.assign(message, {
    timestamp: message.timestamp,
    spaceHash: sha3(message.space),
    payload: prepareProposalPayload(message.payload),
    submitter: message.submitter,
  });
}

function prepareProposalPayload(payload) {
  return Object.assign(payload, {
    nameHash: sha3(payload.name),
    bodyHash: sha3(payload.body),
    snapshot: payload.snapshot,
    start: payload.start,
    end: payload.end,
  });
}
/**
     * {      
      nbNo: 1,
      nbYes: 0,
      weight: BN {
        negative: 0,
        words: [ 1, <1 empty item> ],
        length: 1,
        red: null
      },
      index: 0,
      sig: undefined,
      proof: []
    }*/

function toStepNode(step, verifyingContract, actionId, chainId, merkleTree) {
  return {
    nbNo: step.nbNo,
    nbYes: step.nbYes,
    index: step.index,
    choice: step.choice,
    sig: step.sig,
    timestamp: step.timestamp,
    proposalId: step.proposalId,
    proof: merkleTree.getHexProof(
      buildVoteLeafHashForMerkleTree(step, verifyingContract, actionId, chainId)
    ),
  };
}

async function createVote(proposalId, weight, choice) {
  const payload = {
    choice,
    proposalId,
    weight: toBNWeb3(weight),
  };
  const vote = {
    type: "vote",
    timestamp: Math.floor(new Date().getTime() / 1000),
    payload,
  };

  if (weight.toString() === "0") {
    payload.choice = 0;
  }

  return vote;
}

function buildVoteLeafHashForMerkleTree(
  leaf,
  verifyingContract,
  actionId,
  chainId
) {
  const { domain, types } = getVoteStepDomainDefinition(
    verifyingContract,
    actionId,
    chainId
  );
  const msgParams = {
    domain,
    message: leaf,
    primaryType: "Message",
    types,
  };
  return "0x" + sigUtil.TypedDataUtils.sign(msgParams).toString("hex");
}

async function prepareVoteResult(votes, dao, actionId, chainId) {
  votes.forEach((vote, idx) => {
    const stepIndex = idx + 1;
    vote.choice = vote.choice || vote.payload.choice;
    vote.nbYes = vote.choice === 1 ? vote.payload.weight.toString() : "0";
    vote.nbNo = vote.choice !== 1 ? vote.payload.weight.toString() : "0";
    vote.proposalId = vote.payload.proposalId;
    if (stepIndex > 1) {
      const previousVote = votes[stepIndex - 1];
      vote.nbYes = toBNWeb3(vote.nbYes)
        .add(toBNWeb3(previousVote.nbYes))
        .toString();
      vote.nbNo = toBNWeb3(vote.nbNo)
        .add(toBNWeb3(previousVote.nbNo))
        .toString();
    }

    vote.index = stepIndex;
  });

  const tree = new MerkleTree(
    votes.map((vote) =>
      buildVoteLeafHashForMerkleTree(vote, dao.address, actionId, chainId)
    )
  );

  const result = votes.map((vote) =>
    toStepNode(vote, dao.address, actionId, chainId, tree)
  );

  return { voteResultTree: tree, result };
}

/**
 * 
 struct ProposalMessage {
        uint256 timestamp;
        bytes32 spaceHash;
        address submitter;
        ProposalPayload payload;
        bytes sig;
    }
 */
function prepareVoteProposalData(data, web3) {
  return web3.eth.abi.encodeParameter(
    {
      ProposalMessage: {
        timestamp: "uint64",
        spaceHash: "bytes32",
        submitter: "address",
        payload: {
          nameHash: "bytes32",
          bodyHash: "bytes32",
          choices: "string[]",
          start: "uint64",
          end: "uint64",
          snapshot: "string",
        },
        sig: "bytes",
      },
    },
    {
      timestamp: data.timestamp,
      spaceHash: sha3(data.space),
      payload: prepareVoteProposalPayload(data.payload),
      sig: data.sig || "0x",
      submitter: data.submitter,
    }
  );
}

function prepareVoteProposalPayload(payload) {
  return {
    nameHash: sha3(payload.name),
    bodyHash: sha3(payload.body),
    choices: payload.choices,
    start: payload.start,
    end: payload.end,
    snapshot: payload.snapshot,
  };
}

Object.assign(exports, {
  createVote,
  prepareVoteResult,
  toStepNode,
  buildVoteLeafHashForMerkleTree,
  validateMessage,
  getDomainDefinition,
  signMessage,
  Web3Signer,
  SigUtilSigner,
  Web3JsSigner,
  prepareProposalPayload,
  prepareVoteProposalData,
  prepareProposalMessage,
  getMessageERC712Hash,
  getProposalDomainDefinition,
  getVoteDomainDefinition,
  getVoteStepDomainDefinition,
  getVoteResultRootDomainDefinition,
  TypedDataUtils: sigUtil.TypedDataUtils,
  BadNodeError,
  VotingState,
});
