import { Injectable } from '@nestjs/common';
import { hexToString, Address, createPublicClient, createWalletClient, formatEther, http, getContract, parseUnits } from 'viem';
import * as tokenJson from './assets/MyToken.json';

import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { hash } from 'crypto';
import * as tokenJson2 from './assets/TokenizedBallot.json';



@Injectable()
export class AppService {
  publicClient;
  walletClient;
  contract;
  ballotcontract;

  constructor() {
    // console.log(process.env.PRIVATE_KEY);
    const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`),
    });
    
    this.walletClient = createWalletClient({
      chain: sepolia,
      transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`),
      account: account,
    });
    // console.log(this.walletClient.account.address);

    this.contract = getContract({
      address: process.env.TOKEN_ADDRESS as Address,
      abi: tokenJson.abi,
      client: { public: this.publicClient, wallet: this.walletClient },
    });

    this.ballotcontract = getContract({
      address: process.env.TOKENIZED_BALLOT_ADDRESS as Address,
      abi: tokenJson2.abi,
      client: { public: this.publicClient, wallet: this.walletClient },
    });
  }


  
  async mintTokens(address: any, amount : string = "100") {
    const mintTx = await this.contract.write.mint([address, parseUnits(amount, 18)]);
    await this.publicClient.waitForTransactionReceipt({ hash: mintTx });
    return{
      success: true,
      result: 
      {message: `Minted tokens to ${address}`, 
      address: address,
      hash: mintTx,
    }}
  }

  getServerWalletAddress(): string {
    return process.env.TOKEN_ADDRESS as string;
  }

  async checkMinterRole(address: string): Promise<boolean> {
    // const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
    const MINTER_ROLE =  await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJson.abi,
      functionName: 'MINTER_ROLE'
    });
    const hasRole = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJson.abi,
      functionName: 'hasRole',
      args: [MINTER_ROLE, address],
    });
    return hasRole;
  }
  





  getTransactionReceipt(hash: string) {
    const receipt = this.publicClient.getTransactionReceipt({
      hash: hash as Address,
    });
    return receipt;
  }
  getTokenBalance(address: string) {
    const balance = this.publicClient.readContract({
      address: this.getContractAddress() as Address,
      abi: tokenJson.abi,
      functionName: "balanceOf",
      args: [address as Address]
    });
    const balanceFormatted = formatEther(balance as bigint);
    return balanceFormatted;
  }
  async getTotalSupply() {

    const totalSupplyBN = await this.publicClient.readContract({
      address: this.getContractAddress() as Address,
      abi: tokenJson.abi,
      functionName: "totalSupply"
    });
    const totalSupply = formatEther(totalSupplyBN as bigint);
    return totalSupply;
  }


  getHello(): string {
    return 'Hello World!';
  }
  getContractAddress(): string {
    return process.env.TOKEN_ADDRESS as string;
  }
  
  async getTokenName(): Promise<string> {
    const name = await this.publicClient.readContract({
      address: this.getContractAddress() as Address,
      abi: tokenJson.abi,
      functionName: "name"
    });
    return name as string;
  }


  async checkVotingPower(delagate: string): Promise<string> {
    delagate = delagate as Address;
    const delegatee = await this.contract.read.delegates([delagate]) as any;
    if (delegatee.toLowerCase() !== delagate.toLowerCase()) {
      return "No delegation found for this address";
    }
    const votingPower = await this.ballotcontract.read.getRemainingVotingPower([delagate]) as any;
    return votingPower.toString();
  }

  async delegate(delegatee: string) {
    const delegateTx = await this.contract.write.delegate([delegatee]);
    await this.publicClient.waitForTransactionReceipt({ hash: delegateTx });
    const voteafter = await this.checkVotingPower(delegatee);
    return {
      success: true,
      result: { message: `Delegated voting power to ${delegatee}`, hash: delegateTx },
    };
  }

  async queryResults(): Promise<string> {
    const winningProposalIndex = await this.publicClient.readContract({
      address: this.ballotcontract.address as Address,
      abi: tokenJson2.abi,
      functionName: "winningProposal",
    }) as BigInt;
    const winner = await this.publicClient.readContract({
      address: this.ballotcontract.address as Address,
      abi: tokenJson2.abi,
      functionName: "winnerName",
    }) as `0x${string}`;
    const winnerProposal = await this.publicClient.readContract({
      address: this.ballotcontract.address as Address,
      abi: tokenJson2.abi,
      functionName: "proposals",
      args: [winningProposalIndex],
    }) as [string, BigInt];
    return `The winning proposal is ${hexToString(winner, { size: 32 })} with ${winnerProposal[1]} votes.`;
  }
 
  async castVote(proposalIndex: number, voteAmount: number) {
    const voteTx = await this.ballotcontract.write.vote([proposalIndex, voteAmount]);
    await this.publicClient.waitForTransactionReceipt({ hash: voteTx });
    return {
      success: true,
      result: { message: `Voted ${voteAmount} for proposal ${proposalIndex}`, hash: voteTx },
    };
  }


}
