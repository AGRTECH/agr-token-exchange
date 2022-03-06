export const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";
export const GREEN = "success";
export const RED = "danger";
export const DECIMALS = 10 ** 18;

export const ether = (wei) => {
  if (wei) {
    return wei / DECIMALS;
  }
};

export const tokens = ether;

export const formatBalance = (balance) => {
  balance = ether(balance);
  balance = Math.round(balance * 100) / 100; // Use decimal places
  return balance;
};
