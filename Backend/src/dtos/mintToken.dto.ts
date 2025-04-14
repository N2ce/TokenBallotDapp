import { ApiProperty } from '@nestjs/swagger';

export class MintTokenDto {
    @ApiProperty({ type: 'string', required: true, default: "My Address" })
    address: string;
}

export class CastVoteDto {
    @ApiProperty({ type: 'number', required: true, default: "My Proposal ID" })
    proposalId: number;
    @ApiProperty({ type: 'number', required: true, default: "My Vote" })   
    vote: number;
}
