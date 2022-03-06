import React, { Component } from "react";
import { connect } from "react-redux";
import {
  loadBalances,
  depositEther,
  withdrawEther,
  depositToken,
  withdrawToken,
} from "../store/interactions";
import {
  web3Selector,
  exchangeSelector,
  tokenSelector,
  accountSelector,
  balancesLoadingSelector,
  etherBalanceSelector,
  tokenBalanceSelector,
  exchangeEtherBalanceSelector,
  exchangeTokenBalanceSelector,
  etherDepositAmountSelector,
  etherWithdrawAmountSelector,
  tokenDepositAmountSelector,
  tokenWithdrawAmountSelector,
} from "../store/selectors";
import Spinner from "./Spinner";
import { Tabs, Tab } from "react-bootstrap";
import {
  etherDepositAmountChanged,
  etherWithdrawAmountChanged,
  tokenDepositAmountChanged,
  tokenWithdrawAmountChanged,
} from "../store/actions";

const showForm = (props) => {
  const {
    etherBalance,
    tokenBalance,
    exchangeEtherBalance,
    exchangeTokenBalance,
    dispatch,
    etherDepositAmount,
    tokenDepositAmount,
    exchange,
    token,
    account,
    web3,
    etherWithdrawAmount,
    tokenWithdrawAmount,
  } = props;
  return (
    <Tabs defaultActiveKey="deposit" className="bg-dark text-white">
      <Tab eventKey="deposit" title="Deposit" className="bg-dark">
        <table className="table table-dark table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ETH</td>
              <td>{etherBalance}</td>
              <td>{exchangeEtherBalance}</td>
            </tr>
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            console.log(etherDepositAmount);
            depositEther(dispatch, exchange, web3, etherDepositAmount, account);
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="Eth Amount"
              onChange={(e) => {
                dispatch(etherDepositAmountChanged(e.target.value));
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Deposit
            </button>
          </div>
        </form>
        <table className="table table-dark table-sm small">
          <tbody>
            <tr>
              <td>AGR</td>
              <td>{tokenBalance}</td>
              <td>{exchangeTokenBalance}</td>
            </tr>
          </tbody>
        </table>

        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            depositToken(
              dispatch,
              exchange,
              web3,
              token,
              tokenDepositAmount,
              account
            );
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="AGR Amount"
              onChange={(e) => {
                dispatch(tokenDepositAmountChanged(e.target.value));
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Deposit
            </button>
          </div>
        </form>
      </Tab>
      <Tab eventKey="withdraw" title="Withdraw" className="bg-dark">
        <table className="table table-dark table-sm small">
          <thead>
            <tr>
              <th>Token</th>
              <th>Wallet</th>
              <th>Exchange</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ETH</td>
              <td>{etherBalance}</td>
              <td>{exchangeEtherBalance}</td>
            </tr>
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            withdrawEther(
              dispatch,
              exchange,
              web3,
              etherWithdrawAmount,
              account
            );
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="Eth Amount"
              onChange={(e) => {
                console.log(e.target.value);
                dispatch(etherWithdrawAmountChanged(e.target.value));
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Withdraw
            </button>
          </div>
        </form>
        <table className="table table-dark table-sm small">
          <tbody>
            <tr>
              <td>AGR</td>
              <td>{tokenBalance}</td>
              <td>{exchangeTokenBalance}</td>
            </tr>
          </tbody>
        </table>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            withdrawToken(
              dispatch,
              exchange,
              web3,
              token,
              tokenWithdrawAmount,
              account
            );
          }}
        >
          <div className="col-12 col-sm pr-sm-2">
            <input
              type="text"
              placeholder="AGR Amount"
              onChange={(e) => {
                dispatch(tokenWithdrawAmountChanged(e.target.value));
              }}
              className="form-control form-control-sm bg-dark text-white"
              required
            />
          </div>
          <div className="col-12 col-sm auto pl-sm-0">
            <button type="submit" className="btn btn-primary btn-block btn-sm">
              Withdraw
            </button>
          </div>
        </form>
      </Tab>
    </Tabs>
  );
};

class Balance extends Component {
  UNSAFE_componentWillMount() {
    this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const { dispatch, web3, exchange, token, account } = this.props;
    await loadBalances(dispatch, web3, exchange, token, account);
  }
  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">Balance</div>
        <div className="card-body">
          {this.props.showForm ? showForm(this.props) : <Spinner />}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const balancesLoading = balancesLoadingSelector(state);
  return {
    exchange: exchangeSelector(state),
    account: accountSelector(state),
    token: tokenSelector(state),
    web3: web3Selector(state),
    etherBalance: etherBalanceSelector(state),
    tokenBalance: tokenBalanceSelector(state),
    exchangeEtherBalance: exchangeEtherBalanceSelector(state),
    exchangeTokenBalance: exchangeTokenBalanceSelector(state),
    balancesLoading,
    showForm: !balancesLoading,
    etherDepositAmount: etherDepositAmountSelector(state),
    etherWithdrawAmount: etherWithdrawAmountSelector(state),
    tokenDepositAmount: tokenDepositAmountSelector(state),
    tokenWithdrawAmount: tokenWithdrawAmountSelector(state),
  };
}

export default connect(mapStateToProps)(Balance);
