import type { ConfigDataTypes } from "../types.js"

export const FUNCTION_SIGNATURES: ConfigDataTypes = {
  protocol: [
    '0x8d8798bf', // bondTransferRoot(bytes32,uint256,uint256)	
    '0x23c452cd', // bondWithdrawal(address,uint256,bytes32,uint256)	
    '0x3d12a85a', // bondWithdrawalAndDistribute(address,uint256,bytes32,uint256,uint256,uint256)
    '0x32b949a2', // commitTransfers(uint256)
    '0xcc29a306', // distribute(address,uint256,uint256,uint256,address,uint256)
    '0x81707b80', // resolveChallenge(bytes32,uint256,uint256)
    '0xa6bd1b33', // send(uint256,address,uint256,uint256,uint256,uint256)
    '0xc7525dd3', // settleBondedWithdrawal(address,bytes32,bytes32,uint256,uint256,bytes32[],uint256)
    '0xb162717e', // settleBondedWithdrawals(address,bytes32[],uint256)
    '0xadc9772e', // stake(address,uint256)
    '0x2e17de78', // unstake(uint256)
    '0x0f7aadb7', // withdraw(address,uint256,bytes32,uint256,uint256,uint256,bytes32,uint256,uint256,bytes32[],uint256)
    '0x8e58736f', // confirmRoots(bytes32[],uint256[],uint256[],uint256[])
    '0xeda1122c', // redeem(bytes32)
    '0xf953cec7', // receiveMessage(bytes)
    '0x3f7658fd', // executeSignatures(bytes,bytes)
    '0xd7fd19dd', // relayMessage(address,address,bytes,uint256,(bytes32,(uint256,bytes32,uint256,uint256,bytes),(uint256,bytes32[]),bytes,bytes))
    '0x08635a95', // executeTransaction(bytes32[],uint256,address,address,uint256,uint256,uint256,uint256,bytes)
    '0xd764ad0b', // relayMessage(uint256,address,address,uint256,uint256,bytes)
    '0x4870496f', // proveWithdrawalTransaction((uint256,address,address,uint256,uint256,bytes),uint256,(bytes32,bytes32,bytes32,bytes32),bytes[])
    '0x8c3152e9', // finalizeWithdrawalTransaction((uint256,address,address,uint256,uint256,bytes))
    '0xdeace8f5'  // sendToL2(uint256,address,uint256,uint256,uint256,address,uint256)
  ],
  erc20: [
    '0xa9059cbb', // transfer(address,uint256)
    '0x095ea7b3'  // approve(address,uint256)
  ]
}
