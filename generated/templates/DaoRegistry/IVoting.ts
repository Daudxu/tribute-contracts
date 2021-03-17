// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class IVoting extends ethereum.SmartContract {
  static bind(address: Address): IVoting {
    return new IVoting("IVoting", address);
  }

  getAdapterName(): string {
    let result = super.call("getAdapterName", "getAdapterName():(string)", []);

    return result[0].toString();
  }

  try_getAdapterName(): ethereum.CallResult<string> {
    let result = super.tryCall(
      "getAdapterName",
      "getAdapterName():(string)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  getSenderAddress(
    dao: Address,
    actionId: Address,
    data: Bytes,
    sender: Address
  ): Address {
    let result = super.call(
      "getSenderAddress",
      "getSenderAddress(address,address,bytes,address):(address)",
      [
        ethereum.Value.fromAddress(dao),
        ethereum.Value.fromAddress(actionId),
        ethereum.Value.fromBytes(data),
        ethereum.Value.fromAddress(sender)
      ]
    );

    return result[0].toAddress();
  }

  try_getSenderAddress(
    dao: Address,
    actionId: Address,
    data: Bytes,
    sender: Address
  ): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "getSenderAddress",
      "getSenderAddress(address,address,bytes,address):(address)",
      [
        ethereum.Value.fromAddress(dao),
        ethereum.Value.fromAddress(actionId),
        ethereum.Value.fromBytes(data),
        ethereum.Value.fromAddress(sender)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  voteResult(dao: Address, proposalId: Bytes): i32 {
    let result = super.call(
      "voteResult",
      "voteResult(address,bytes32):(uint8)",
      [
        ethereum.Value.fromAddress(dao),
        ethereum.Value.fromFixedBytes(proposalId)
      ]
    );

    return result[0].toI32();
  }

  try_voteResult(dao: Address, proposalId: Bytes): ethereum.CallResult<i32> {
    let result = super.tryCall(
      "voteResult",
      "voteResult(address,bytes32):(uint8)",
      [
        ethereum.Value.fromAddress(dao),
        ethereum.Value.fromFixedBytes(proposalId)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
  }
}

export class StartNewVotingForProposalCall extends ethereum.Call {
  get inputs(): StartNewVotingForProposalCall__Inputs {
    return new StartNewVotingForProposalCall__Inputs(this);
  }

  get outputs(): StartNewVotingForProposalCall__Outputs {
    return new StartNewVotingForProposalCall__Outputs(this);
  }
}

export class StartNewVotingForProposalCall__Inputs {
  _call: StartNewVotingForProposalCall;

  constructor(call: StartNewVotingForProposalCall) {
    this._call = call;
  }

  get dao(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get proposalId(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }

  get data(): Bytes {
    return this._call.inputValues[2].value.toBytes();
  }
}

export class StartNewVotingForProposalCall__Outputs {
  _call: StartNewVotingForProposalCall;

  constructor(call: StartNewVotingForProposalCall) {
    this._call = call;
  }
}

export class GetSenderAddressCall extends ethereum.Call {
  get inputs(): GetSenderAddressCall__Inputs {
    return new GetSenderAddressCall__Inputs(this);
  }

  get outputs(): GetSenderAddressCall__Outputs {
    return new GetSenderAddressCall__Outputs(this);
  }
}

export class GetSenderAddressCall__Inputs {
  _call: GetSenderAddressCall;

  constructor(call: GetSenderAddressCall) {
    this._call = call;
  }

  get dao(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get actionId(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get data(): Bytes {
    return this._call.inputValues[2].value.toBytes();
  }

  get sender(): Address {
    return this._call.inputValues[3].value.toAddress();
  }
}

export class GetSenderAddressCall__Outputs {
  _call: GetSenderAddressCall;

  constructor(call: GetSenderAddressCall) {
    this._call = call;
  }

  get value0(): Address {
    return this._call.outputValues[0].value.toAddress();
  }
}

export class VoteResultCall extends ethereum.Call {
  get inputs(): VoteResultCall__Inputs {
    return new VoteResultCall__Inputs(this);
  }

  get outputs(): VoteResultCall__Outputs {
    return new VoteResultCall__Outputs(this);
  }
}

export class VoteResultCall__Inputs {
  _call: VoteResultCall;

  constructor(call: VoteResultCall) {
    this._call = call;
  }

  get dao(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get proposalId(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }
}

export class VoteResultCall__Outputs {
  _call: VoteResultCall;

  constructor(call: VoteResultCall) {
    this._call = call;
  }

  get state(): i32 {
    return this._call.outputValues[0].value.toI32();
  }
}