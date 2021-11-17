import { useEffect, useState } from 'react';
import Web3 from 'web3';
import TokenContract from '../build/contracts/Token.json';
import BankContract from '../build/contracts/Bank.json';

export default function Home() {
  const [account, setAccount] = useState({
    address: '0x00',
    eth: 0,
    kit: 0,
  });
  const [option, setOption] = useState('Deposit');
  const [isWithdrawing, setIsWithdrawing] = useState(0);
  const [token, setToken] = useState();
  const [bank, setBank] = useState();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDeposited, setIsDeposited] = useState(false);

  const [alert, setAlert] = useState({
    message: '',
    color: '',
    dismissable: false,
  });

  useEffect(() => {
    loadWeb3().then(loadBlockchainData).then(setLoading);
  }, []);

  useEffect(() => {
    alert.dismissable &&
      setTimeout(
        () =>
          setAlert({
            message: '',
            color: '',
            dismissable: false,
          }),
        5000
      );
  }, [alert]);

  const loadWeb3 = async () => {
    setLoading(true);
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
    const web3 = window.web3;
    // Get account and its balance
    const accounts = await web3.eth.getAccounts();
    const eth = await web3.eth.getBalance(accounts[0]);
    setAccount((prev) => ({
      ...prev,
      address: accounts[0],
      eth: web3.utils.fromWei(eth),
    }));
    // Get the network ID
    const netId = await web3.eth.net.getId();
    // Load token contract
    const tokenData = TokenContract.networks[netId];
    if (tokenData) {
      const tokenContract = new web3.eth.Contract(
        TokenContract.abi,
        tokenData.address
      );
      setToken(tokenContract);
      // Get kits owned by user
      const kits = await tokenContract.methods.balanceOf(accounts[0]).call();
      setAccount((prev) => ({
        ...prev,
        kit: web3.utils.fromWei(kits.toString()),
      }));
    } else {
      alert('Token contract not deployed to this network');
    }
    // Load bank contract
    const bankData = BankContract.networks[netId];
    if (bankData) {
      const bankContract = new web3.eth.Contract(
        BankContract.abi,
        bankData.address
      );
      setBank(bankContract);
      const deposited = await bankContract.methods
        .isDeposited(accounts[0])
        .call();
      setIsDeposited(deposited);
    } else {
      alert('EthSwap contract not deployed to this network');
    }
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

  const handleClick = async () => {
    setLoading(true);
    try {
      isWithdrawing ? await handleWithdraw() : await handleDeposit();
      setAmount('0');
      loadBlockchainData();
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
      <div
        className={`absolute bg-${alert.color}-100 text-${
          alert.color
        }-900 py-2 px-4 rounded z-20 top-32 ${
          alert.message ? 'translate-y-0' : '-translate-y-52'
        }`}
      >
        {alert.message}
      </div>
      {/* Warning */}
      <p className='bg-red-100 text-red-500 p-2 px-3 rounded text-sm'>
        <span className='font-bold'>IMPORTANT.</span> Don't spend real ETH here,
        this website is for demo purposes. Connect with a TEST ACCOUNT ONLY.
        {/* <a className='text-red-900 border-b border-red-900 cursor-pointer'>
          Read Here
        </a> */}
      </p>
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
