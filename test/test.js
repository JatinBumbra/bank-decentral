const { expect } = require('chai');

const Token = artifacts.require('Token');
const Bank = artifacts.require('Bank');

require('chai').use(require('chai-as-promised')).should();

const fromEtherToWei = (wei) => web3.utils.toWei(wei);

contract('Bank', ([deployer, user]) => {
  let bank, token;
  const interestPerSecond = 31668017; //(10% APY) for min. deposit (0.01 ETH)

  beforeEach(async () => {
    token = await Token.new();
    bank = await Bank.new(token.address);
    // Make bank the minter for token
    await token.passMinterRole(bank.address, { from: deployer });
  });

  describe('Token Contract', () => {
    describe('success', () => {
      it('has correct name', async () => {
        expect(await token.name()).equal('Kitty Token');
      });
      it('has correct symbol', async () => {
        expect(await token.symbol()).equal('KIT');
      });
      it('has correct initial supply of 0', async () => {
        const totalSupply = await token.totalSupply();
        expect(totalSupply.toString()).equal('0');
      });
      it('has bank as the minter', async () => {
        expect(await token.minter()).equal(bank.address);
      });
    });

    describe('failure', () => {
      it('changing minter role is rejected', async () => {
        await token.passMinterRole(user, { from: deployer }).should.be.rejected;
      });
      it('does not allow unauthorized minting', async () => {
        await token.mint(user, '1', { from: deployer }).should.be.rejected;
      });
    });
  });

  describe('deposit()', () => {
    describe('success', () => {
      beforeEach(async () => {
        await bank.deposit({ from: user, value: fromEtherToWei('1') });
      });

      it('takes deposit from user and marks as depositor', async () => {
        const depositValue = await bank.weiBalanceOf(user);
        expect(depositValue.toString()).equal(fromEtherToWei('1'));

        const isDep = await bank.isDeposited(user);
        expect(isDep.toString()).equal('true');
      });
    });

    describe('failure', () => {
      it('rejects user if deposit amount is less than 0.01 ETH', async () => {
        await bank.deposit({ from: user, value: fromEtherToWei('0.009') })
          .should.be.rejected;
      });

      it('rejects if user tries to deposit more than once', async () => {
        await bank.deposit({ from: user, value: fromEtherToWei('1') });
        await bank.deposit({ from: user, value: fromEtherToWei('1') }).should.be
          .rejected;
      });
    });
  });

  describe('withdraw()', () => {
    describe('success', () => {
      it('transfers the correct interest tokens to user and reset appropriate fields', async () => {
        await bank.deposit({ from: user, value: fromEtherToWei('1') });

        setTimeout(async () => {
          await bank.withdraw({ from: user });

          const userInterest = await token.balanceOf(user);
          expect(userInterest.toNumber()).equal(interestPerSecond);

          const timestamp = await bank.depositStart(user);
          expect(timestamp.toNumber()).equal(0);

          const deposit = await bank.weiBalanceOf(user);
          expect(deposit.toNumber()).equal(0);

          const status = await bank.isDeposited(user);
          expect(status.toString()).equal('false');
        }, 3000);
      });
    });

    describe('failure', () => {
      it('rejects if user tries to withdraw without deposit', async () => {
        await bank.withdraw({ from: user }).should.be.rejected;
      });
    });
  });
});
