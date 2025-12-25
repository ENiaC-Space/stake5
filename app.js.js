let web3, account;

// ===== MAINNET ADDRESS =====
const ENIAC = "0xafF339de48848d0F8B5704909Ac94e8E8D7E3415";
const MASTERCHEF = "0x564DF71B75855d63c86a267206Cd0c9e35c92789";
const PID_STAKE = 0;
const CHAIN_ID = "0x38"; // BSC (đổi nếu chain khác)

// ===== ABI RÚT GỌN =====
const ERC20_ABI = [
  {"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","type":"function"},
  {"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"type":"uint256"}],"type":"function"}
];

const MASTER_ABI = [
  {"inputs":[{"name":"_pid","type":"uint256"},{"name":"_amount","type":"uint256"}],"name":"deposit","type":"function"},
  {"inputs":[{"name":"_pid","type":"uint256"},{"name":"_amount","type":"uint256"}],"name":"withdraw","type":"function"},
  {"inputs":[{"name":"_pid","type":"uint256"},{"name":"_user","type":"address"}],"name":"pendingANT","outputs":[{"type":"uint256"}],"type":"function"},
  {"inputs":[],"name":"poolLength","outputs":[{"type":"uint256"}],"type":"function"},
  {"inputs":[{"type":"uint256"}],"name":"poolInfo","outputs":[{"type":"address"},{"type":"uint256"},{"type":"uint256"},{"type":"uint256"}],"type":"function"},
  {"inputs":[{"type":"uint256"},{"type":"address"}],"name":"userInfo","outputs":[{"type":"uint256"},{"type":"uint256"}],"type":"function"},
  {"inputs":[],"name":"ANTPerBlock","outputs":[{"type":"uint256"}],"type":"function"}
];

// ===== INIT =====
document.getElementById("connectBtn").onclick = connect;

function token(){ return new web3.eth.Contract(ERC20_ABI, ENIAC); }
function master(){ return new web3.eth.Contract(MASTER_ABI, MASTERCHEF); }

// ===== CONNECT =====
async function connect(){
  if(!window.ethereum) return alert("Install MetaMask");

  if (ethereum.chainId !== CHAIN_ID) {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID }]
    });
  }

  web3 = new Web3(window.ethereum);
  const accs = await ethereum.request({ method: "eth_requestAccounts" });
  account = accs[0];

  document.getElementById("wallet").innerText =
    account.slice(0,6) + "..." + account.slice(-4);

  loadStake();
  loadFarms();
}

// ===== STAKE =====
async function approve(){
  await token().methods
    .approve(MASTERCHEF, web3.utils.toWei("100000000"))
    .send({from: account});
}

async function stake(){
  const v = document.getElementById("amount").value;
  if(v <= 0) return;
  await master().methods.deposit(PID_STAKE, web3.utils.toWei(v))
    .send({from: account});
  loadStake();
}

async function withdraw(){
  const v = document.getElementById("amount").value;
  await master().methods.withdraw(PID_STAKE, web3.utils.toWei(v))
    .send({from: account});
  loadStake();
}

async function harvest(){
  await master().methods.deposit(PID_STAKE, 0)
    .send({from: account});
  loadStake();
}

async function loadStake(){
  const user = await master().methods.userInfo(PID_STAKE, account).call();
  const pending = await master().methods.pendingANT(PID_STAKE, account).call();

  document.getElementById("staked").innerText =
    web3.utils.fromWei(user.amount);
  document.getElementById("pending").innerText =
    web3.utils.fromWei(pending);

  // APR (ước tính)
  const antPB = await master().methods.ANTPerBlock().call();
  const tvl = await token().methods.balanceOf(MASTERCHEF).call();
  const apr = tvl > 0 ? (antPB * 10512000 / tvl) * 100 : 0;
  document.getElementById("apr").innerText = apr.toFixed(2) + "%";
}

// ===== FARM MULTI POOL =====
async function loadFarms(){
  const len = await master().methods.poolLength().call();
  const div = document.getElementById("farms");
  div.innerHTML = "";

  for(let pid=0; pid<len; pid++){
    div.innerHTML += `
      <div class="farm">
        <b>Pool #${pid}</b><br>
        <input id="f${pid}" placeholder="Amount">
        <button onclick="depositFarm(${pid})">Stake</button>
        <button onclick="withdrawFarm(${pid})">Unstake</button>
      </div>
    `;
  }
}

async function depositFarm(pid){
  const v = document.getElementById("f"+pid).value;
  await master().methods.deposit(pid, web3.utils.toWei(v))
    .send({from: account});
}

async function withdrawFarm(pid){
  const v = document.getElementById("f"+pid).value;
  await master().methods.withdraw(pid, web3.utils.toWei(v))
    .send({from: account});
}

// ===== UI =====
function showTab(id){
  document.getElementById("stake").style.display="none";
  document.getElementById("farm").style.display="none";
  document.getElementById(id).style.display="block";
}
