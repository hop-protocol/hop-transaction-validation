## Lambda Bonder Transaction Validation

Tools to add bonder validation to AWS Lambda

### Usage

#### Generate new validation zip

```bash
npm run generate-validation-zip
```

#### Other

Common function signatures:

```
Bridge
'0x8d8798bf' - bondTransferRoot(bytes32,uint256,uint256)
'0x23c452cd' - bondWithdrawal(address,uint256,bytes32,uint256)
'0x3d12a85a' - bondWithdrawalAndDistribute(address,uint256,bytes32,uint256,uint256,uint256)
'0x32b949a2' - commitTransfers(uint256)
'0xcc29a306' - distribute(address,uint256,uint256,uint256,address,uint256)
'0x81707b80' - resolveChallenge(bytes32,uint256,uint256)
'0xa6bd1b33' - send(uint256,address,uint256,uint256,uint256,uint256)
'0xc7525dd3' - settleBondedWithdrawal(address,bytes32,bytes32,uint256,uint256,bytes32[],uint256)
'0xb162717e' - settleBondedWithdrawals(address,bytes32[],uint256)
'0xadc9772e' - stake(address,uint256)
'0x2e17de78' - unstake(uint256)
'0x0f7aadb7' - withdraw(address,uint256,bytes32,uint256,uint256,uint256,bytes32,uint256,uint256,bytes32[],uint256)

Bridge Wrapper
'0x8e58736f' - confirmRoots(bytes32[],uint256[],uint256[],uint256[])

Chain-specific
'0xeda1122c' - Arbitrum - redeem(bytes32)
'0xf953cec7' - Polygon - receiveMessage(bytes)
'0x3f7658fd' - Gnosis - executeSignatures(bytes,bytes)
'0xd7fd19dd' - Optimism - relayMessage(address,address,bytes,uint256,tuple)
'0x08635a95' - Arbitrum  - executeTransaction(bytes32[],uint256,address,address,uint256,uint256,uint256,uint256,bytes)

ERC20
'0xa9059cbb' - transfer
```