import { nat64, $query, $update, ic } from "azle";

type Account = {
  address: string;
  balance: nat64;
  allowances: {
    [spender: string]: nat64;
  };
};

type State = {
  accounts: {
    [key: string]: Account;
  };
  name: string;
  ticker: string;
  totalSupply: nat64;
};

let state: State = {
  accounts: {},
  name: "",
  ticker: "", // = 심볼
  totalSupply: 0n,
};

function getCaller(): string {
  const caller = ic.caller().toString();
  if (caller === null) {
    throw new Error("Caller is null");
  }
  return caller;
}

$update;
export function initialize(
  name: string,
  ticker: string,
  totalSupply: nat64
): string {
  state = {
    ...state,
    name,
    ticker,
    totalSupply,
  };

  const creatorAddress = getCaller();
  state.accounts[creatorAddress] = {
    address: creatorAddress,
    balance: totalSupply,
    allowances: {},
  };

  return creatorAddress;
}

$update;
export function transfer(
  fromAddress: string,
  toAddress: string,
  amount: nat64
): boolean {
  if (state.accounts[toAddress] === undefined) {
    state.accounts[toAddress] = {
      address: toAddress,
      balance: 0n,
      allowances: {},
    };
  }
  state.accounts[fromAddress].balance -= amount;
  state.accounts[toAddress].balance += amount;

  return true;
}

$query;
export function balanceOf(address: string): nat64 {
  /*
        state.accounts[address]? => 해당 값이 null이면, null 대신 Undefined를 반환한다.
        그리고, ?? 연산자는 왼쪽 값이 null 또는 undefined 값이면 오른쪽 값을 반환한다.
    */
  return state.accounts[address]?.balance ?? 0n;
}

$query;
export function ticker(): string {
  return state.ticker;
}

$query;
export function name(): string {
  return state.name;
}

$query;
export function totalSupply(): nat64 {
  return state.totalSupply;
}

$update;
export function approve(spender: string, amount: nat64): boolean {
  const owner = getCaller();
  const ownerAccount = state.accounts[owner];
  if (!ownerAccount) {
    return false;
  }

  ownerAccount.allowances[spender] = amount;
  return true;
}

$query;
export function allowance(owner: string, spender: string): nat64 {
  const ownerAccount = state.accounts[owner];
  if (!ownerAccount) {
    return 0n;
  }

  const allowance = ownerAccount.allowances[spender];
  return allowance ? allowance : 0n;
}

$update;
export function transferFrom(
  fromAddress: string,
  toAddress: string,
  amount: nat64
): boolean {
  const spender = getCaller();
  const fromAccount = state.accounts[fromAddress];
  if (!fromAccount || fromAccount.balance < amount) {
    return false; // insufficien balance or sender doesn't exist
  }

  const allowance = fromAccount.allowances[spender];
  if (allowance === undefined || allowance < amount) {
    return false; // insufficient allowance
  }

  if (state.accounts[toAddress] === undefined) {
    state.accounts[toAddress] = {
      address: toAddress,
      balance: 0n,
      allowances: {},
    };
  }

  // perform the transfer
  fromAccount.balance -= amount;
  state.accounts[toAddress].balance += amount;
  fromAccount.allowances[spender] -= amount;

  return true;
}
