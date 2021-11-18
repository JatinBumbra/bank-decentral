import { useEffect, useState } from 'react';
import Web3 from 'web3';
import TokenContract from '../contracts/build/Token.json';
import BankContract from '../contracts/build/Bank.json';

const initAlert = {
  message: '',
  color: '',
  dismissable: false,
};

export default function Home() {
  const [account, setAccount] = useState({
    address: '0x00',
    eth: 0,
    kit: 0,
  });
  const [option, setOption] = useState('Deposit');
  const [isWithdrawing, setIsWithdrawing] = useState(0);
  const [bank, setBank] = useState();
  const [amount, setAmount] = useState(0);
  const [isDeposited, setIsDeposited] = useState(false);

  const [contractsLoaded, setContractsLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(initAlert);

  useEffect(() => {
    resetUI();
    window.ethereum.on('accountsChanged', resetUI);
    window.ethereum.on('chainChanged', resetUI);
  }, []);

  useEffect(() => {
    alert.dismissable && setTimeout(() => setAlert(initAlert), 5000);
  }, [alert]);

  const resetUI = () => {
    setLoading(true);
    setAmount(0);
    setIsWithdrawing(0);
    setBank();
    setOption('Deposit');
    setIsDeposited(false);
    setAlert(initAlert);
    setContractsLoaded(false);
    loadWeb3().then(loadBlockchainData).then(setLoading);
  };

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      setAlert({
        color: 'red',
        message: 'Non-Etherium browser detected. Try MetaMask',
        dismissable: false,
      });
    }
  };

  const loadBlockchainData = async () => {
    // Load web3
    const web3 = window.web3;
    if (!web3) return;
    // Data vars
    let address, eth, kit;
    // Get account
    const accounts = await web3.eth.getAccounts();
    address = accounts[0];
    // Get the network ID
    const netId = await web3.eth.net.getId();
    // Get ether balance for address
    const ethb = await web3.eth.getBalance(address);
    eth = web3.utils.fromWei(ethb.toString());
    // Load token contract
    const tokenData = TokenContract.networks[netId];
    if (tokenData) {
      const tokenContract = new web3.eth.Contract(
        TokenContract.abi,
        tokenData.address
      );
      // Get kits owned by user
      const kitb = await tokenContract.methods.balanceOf(address).call();
      kit = web3.utils.fromWei(kitb.toString());
    }
    // Load bank contract
    const bankData = BankContract.networks[netId];
    if (bankData) {
      const bankContract = new web3.eth.Contract(
        BankContract.abi,
        bankData.address
      );
      setBank(bankContract);
      const deposited = await bankContract.methods.isDeposited(address).call();
      setIsDeposited(deposited);
    }
    // If contracts are not deployed, then show error
    if (!tokenData || !bankData) {
      setAlert({
        color: 'red',
        message:
          'Contracts not deployed to this network. Switch to Ropsten Network.',
        dismissable: false,
      });
    }
    if (tokenData && bankData) {
      setContractsLoaded(true);
    }

    setAccount({ address, eth, kit });
  };

  const handleDeposit = async () => {
    const amountInWei = web3.utils.toWei(amount);
    await bank.methods
      .deposit()
      .send({ from: account.address, value: amountInWei });
    setAlert({
      color: 'green',
      message: 'Deposit successful',
      dismissable: true,
    });
  };

  const handleWithdraw = async () => {
    await bank.methods.withdraw().send({ from: account.address });
    setAlert({
      color: 'green',
      message: 'Withdraw successful',
      dismissable: true,
    });
  };

  const _checkLoaded = () => {
    if (!contractsLoaded) {
      setAlert({
        color: 'red',
        message:
          'Contracts not deployed to this network. Switch to Ropsten Network.',
        dismissable: false,
      });
      return false;
    }
    if (alert.message) return false;
    return true;
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      if (!_checkLoaded()) return;
      isWithdrawing ? await handleWithdraw() : await handleDeposit();
      resetUI();
    } catch (error) {
      setAlert({
        color: 'red',
        message: error.message,
        dismissable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='px-12 py-2'>
      {/* Alert */}
      <p className='bg-red-500'></p>
      <p className='bg-green-500'></p>
      {loading ? (
        <p className='bg-yellow-500 text-white p-1 text-sm text-center'>
          Loading...
        </p>
      ) : null}
      {alert.message ? (
        <div
          className={`bg-${alert.color}-500 text-white text-center text-sm p-1`}
        >
          {alert.message}
        </div>
      ) : null}
      {/* Header */}
      <header className='py-3 flex justify-between'>
        <p className='text-2xl font-medium'>
          <span className='text-gray-500'>Bank </span>
          <span className='text-blue-500 font-black'>Decentral</span>
        </p>
        <div className='text-right text-sm'>
          <p className='font-semibold'>Your Account Address</p>
          <p className='font-medium opacity-50'>{account.address}</p>
        </div>
      </header>
      {/* Main */}
      <main className='pb-6'>
        <div className='grid grid-cols-2 gap-4'>
          {/* Hero Section */}
          <div className='mt-20'>
            <h1 className='text-5xl text-blue-500 font-black mt-2 mb-3'>
              The most rewarding decentralized bank is here.
            </h1>
            <h2 className='text-3xl text-gray-800 font-black'>
              Earn interest on your Ether investments.
            </h2>
            <p className='text-lg mt-10'>Interest Earned: {account.kit} KIT</p>
            <p className='text-sm text-gray-500'>(On previous investments)</p>
          </div>
          {/* Exchange table */}
          <div className='mt-6 ml-20'>
            <ul className='flex justify-center'>
              {['Deposit', 'Withdraw'].map((op, i) => (
                <li
                  key={op}
                  className={`cursor-pointer mx-4 pl-2 pr-3 py-3 mb-5  ${
                    option === op
                      ? 'text-blue-500 font-medium border-b-2 border-blue-500'
                      : 'text-gray-500'
                  }`}
                  onClick={() => {
                    setOption(op);
                    setIsWithdrawing(i);
                  }}
                >
                  {op}
                </li>
              ))}
            </ul>
            <div className='border p-5 rounded-lg hover:shadow-2xl focus-within:shadow-2xl'>
              <div className='mb-6'>
                {isDeposited && !isWithdrawing ? (
                  <span className='text-xs py-1 px-3 rounded-full mb-2 inline-block text-white bg-green-400'>
                    Deposite Active
                  </span>
                ) : null}
                {!isDeposited && isWithdrawing ? (
                  <span className='text-xs py-1 px-3 rounded-full mb-2 inline-block text-white bg-red-400'>
                    Cannot Withdraw. Deposite Not Active
                  </span>
                ) : null}
                <p className='text-2xl font-semibold mb-1'>
                  {isWithdrawing
                    ? 'Reward your patience'
                    : 'Start Your Deposit Here'}
                </p>
                <p className='text-sm text-gray-600'>
                  {isWithdrawing
                    ? 'Withdraw your funds and receive reward tokens.'
                    : 'Minimum deposit balance is 0.01 ETH and is allowed only once. Deposit more to earn more.'}
                </p>
              </div>
              {!isWithdrawing ? (
                <div className='mb-6'>
                  <p className='flex justify-between text-xs'>
                    <label htmlFor='' className='font-semibold'>
                      Enter Deposit Amount
                    </label>
                    <span htmlFor=''>Balance: {account.eth} ETH</span>
                  </p>
                  <div className='border flex mt-2 rounded overflow-hidden'>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type='number'
                      min='1'
                      className='border-none outline-none flex-1 w-auto p-4 focus:bg-gray-100 disabled:cursor-not-allowed'
                      disabled={loading || isDeposited}
                    />
                  </div>
                </div>
              ) : null}

              <button
                className='bg-blue-500 font-bold text-white text-center rounded-full w-full p-4 disabled:opacity-50 hover:bg-blue-600 active:bg-blue-800 disabled:cursor-not-allowed'
                disabled={
                  loading || (isWithdrawing ? !isDeposited : isDeposited)
                }
                onClick={handleClick}
              >
                {isWithdrawing ? 'Withdraw' : 'Deposit Now'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
