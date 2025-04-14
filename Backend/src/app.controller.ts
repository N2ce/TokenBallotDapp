import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { CastVoteDto, MintTokenDto } from './dtos/mintToken.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('contract-address')
  getContractAddress(){
    return {result: this.appService.getContractAddress()};
  }

  @Get('token-name')
  async getTokenName() {
    return {result: await this.appService.getTokenName()};
  }

  @Get('total-supply')
  async getTotalSupply() {
    return {result: await this.appService.getTotalSupply()};
  }

  @Get('token-balance/:address')
  async getTokenBalance(@Param('address') address: string) {
    return {result: await this.appService.getTokenBalance(address)};
  }

  @Get('transaction-receipt')
  async getTransactionReceipt(@Query('hash') hash: string) {
    return {result: await this.appService.getTransactionReceipt(hash)};
  }

  @Get('server-wallet-address')
  getServerWalletAddress() {
    return {result: this.appService.getServerWalletAddress()};
  }

  @Get('check-minter-role')
  async checkMinterRole(@Query('address') address: string) {
    return {result: this.appService.checkMinterRole(address)};
  }

  @Get('check-voting-power')
  async checkVotingPower(@Query('address') address: string) {
    return {result: await this.appService.checkVotingPower(address)};
  }

  @Post('mint-tokens')
  async mintTokens(@Body() body: MintTokenDto) {
    // const { address, amount } = body;
    return { result: await this.appService.mintTokens(body.address) };
  }
  @Post('delegate-voting-power')
  async delegate(@Body() body: MintTokenDto) {
    return { result: await this.appService.delegate(body.address) };
  }

  @Get('query-winner') 
  async queryResults() {
    return { result: await this.appService.queryResults() };
  }

  @Post('vote')
  async castVote(@Body() body: CastVoteDto) {
    const { proposalId, vote } = body;
    return { result: await this.appService.castVote(proposalId, vote) };
  }
}
