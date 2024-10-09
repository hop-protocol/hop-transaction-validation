import type { GeneralizedConfig } from "../types.js"

export const ADDRESSES: GeneralizedConfig = {
  protocol: [
    '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1', // DAI - Ethereum
    '0x0460352b91D7CF42B0E1C1c30f06B602D9ef2238', // DAI - Gnosis
    '0xEcf268Be00308980B5b3fcd0975D47C4C8e1382a', // DAI - Polygon
    '0x7191061D5d4C60f598214cC6913502184BAddf18', // DAI - Optimism
    '0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6', // DAI - Arbitrum
    '0xC3d56808907F6A45042c7e81A8a7Db72C5F7F9F6', // DAI - Gnosis Messenger Wrapper
    '0x172cAbe34c757472249aD4Bd97560373fBbf0DA3', // DAI - Polygon Messenger Wrapper
    '0x115F423b958A2847af0F5bF314DB0f27c644c308', // DAI - Optimism Messenger Wrapper
    '0x2d6fd82C7f531328BCaCA96EF985325C0894dB62', // DAI - Arbitrum Messenger Wrapper
    '0x4C36d2919e407f0Cc2Ee3c993ccF8ac26d9CE64e', // DAI - Gnosis canonical bridge on Ethereum
    '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1', // DAI - Optimism canonical bridge on Ethereum
    '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840', // DAI - Arbitrum canonical bridge on Ethereum
    '0xbEb5Fc579115071764c7423A4f12eDde41f106Ed', // DAI - Optimism L1 Portal Contract
    '0x4200000000000000000000000000000000000007', // DAI - Optimism L2 Messenger Contract
    '0x000000000000000000000000000000000000006E'  // DAI - Arbitrum L2 Retryable TX Contract
  ],
  erc20: [
    '0xb8901acB165ed027E32754E0FFe830802919727f', // Hop L1 ETH Bridge
    '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC', // HOP Token (all chains)
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI - Ethereum DAI
    '0xB1ea9FeD58a317F81eEEFC18715Dd323FDEf45c4', // DAI - Polygon DAI
    '0x56900d66D74Cb14E3c86895789901C9135c95b16', // DAI - hDAI on Optimism
    '0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'  // DAI - hDAI on Arbitrum
  ]
}
