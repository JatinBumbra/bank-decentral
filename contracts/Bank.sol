// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import './Token.sol';

contract Bank {
    Token public token;

    constructor(Token _token) {
        token = _token;
    }
    // The balance of depositor in wei
    mapping (address=>uint) public weiBalanceOf;
    // Track the deposit time for the depositor
    mapping(address => uint) public depositStart;
    // Status of deposit and borrow
    mapping (address=>bool) public isDeposited;

    event Deposit(address indexed user, uint etherAmount, uint timeStart);
    event Withdraw(address indexed user, uint etherAmount, uint depositTime, uint interest);

    // Deposit funds to the bank
    function deposit() payable public {
        require(isDeposited[msg.sender] == false, 'Error, deposit already active');
        // Require that the amount sent by user is greater than 0.01 ETH
        require(msg.value >= 0.01 ether,'Error, deposit must be >= 0.01 ETH');
        // Add the deposit value for the user
        weiBalanceOf[msg.sender] += msg.value;
        // Set the deposit timestamp for the user
        depositStart[msg.sender] += block.timestamp;
        // Set deposit status for user
        isDeposited[msg.sender] = true;

        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    // Withdraw funds from the bank
    function withdraw() public {
        require(isDeposited[msg.sender] == true,'Error, no deposit active');
        // Get the deposit balance of user
        uint userBalance = weiBalanceOf[msg.sender];
        // Check the hold time for user
        uint depositTime = block.timestamp - depositStart[msg.sender];
        // Calculate the interest
         /*
            Principal amount = 0.01 ETH (min deposit) = 10e16 Wei
            Rate = 10% = 0.001 ETH = 10e15 Wei (ETH interest earned over 1 year)
            Time = 1 Year = 31577600 seconds

            Wei earned as interest per second for 0.01 ETH deposit = ETH interest earned over 1 year / Number of seconds in 1 year
                                                                   = 10e15 Wei / 31577600 s
                                                                   = 31668017 Wei/s
        
            Wei earned as interest per second for x ETH desposit = IPS for 0.01 ETH * (x ETH / 0.01 ETH)
        */
        uint interestPerSecond = 31668017 * (weiBalanceOf[msg.sender]/0.01 ether);
        uint interest = interestPerSecond * depositTime;
        // Send the funds to user
        payable(msg.sender).transfer(userBalance);
        // Send the deposit reward tokens to user
        token.mint(msg.sender, interest);
        // Reset depostor data
        depositStart[msg.sender] = 0;
        weiBalanceOf[msg.sender] = 0;
        isDeposited[msg.sender] = false;

        emit Withdraw(msg.sender, userBalance, depositTime, interest);
    }
}