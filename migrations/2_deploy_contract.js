const Token = artifacts.require('Token');
const Bank = artifacts.require('Bank');

module.exports = async function (deployer) {
  // Deploy token and get deployed instance
  await deployer.deploy(Token);
  const token = await Token.deployed();
  // Deploy the bank & pass token address to it (for future minting) and get deployed instance
  await deployer.deploy(Bank, token.address);
  const bank = await Bank.deployed();
  // Make bank the minter for the token
  await token.passMinterRole(bank.address);
};
