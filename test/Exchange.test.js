import { tokens, EVM_REVERT, ETHER_ADDRESS } from "./helpers";

const Token = artifacts.require("./Token");
const Exchange = artifacts.require("./Exchange");

require("chai").use(require("chai-as-promised")).should();

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
  let token;
  let exchange;
  const feePercent = 1;

  beforeEach(async () => {
    token = await Token.new();

    await token.transfer(user1, tokens(100), { from: deployer });

    exchange = await Exchange.new(feeAccount, feePercent);
  });

  describe("deployment", () => {
    it("tracks the fee account", async () => {
      const result = await exchange.feeAccount();
      assert.equal(result, feeAccount);
    });
    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      assert.equal(result.toString(), feePercent.toString());
    });
  });

  describe("fallback", () => {
    it("reverts when Ether is sent", async () => {
      await exchange
        .sendTransaction({ value: 1, from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });

  describe("depositing Ether", async () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(1);
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    it("tracks the Ether deposit", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);

      assert.equal(balance.toString(), amount.toString());
    });

    it("emits a Deposit event", async () => {
      const log = result.logs[0];
      assert.equal(log.event, "Deposit");
      const event = log.args;
      assert.equal(event.token, ETHER_ADDRESS, "token address is correct");
      assert.equal(event.user, user1, "user address is correct");
      assert.equal(
        event.amount.toString(),
        amount.toString(),
        "amount is correct"
      );
      assert.equal(
        event.balance.toString(),
        amount.toString(),
        "balance is correct"
      );
    });
  });

  describe("withdrawing Ether", async () => {
    let result;
    let amount;

    beforeEach(async () => {
      // Deposit Ether first
      amount = tokens(1);
      await exchange.depositEther({ from: user1, value: amount });
    });

    describe("success", async () => {
      beforeEach(async () => {
        // Withdraw Ether
        result = await exchange.withdrawEther(amount, { from: user1 });
      });

      it("withdraws Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        assert.equal(balance.toString(), "0");
      });

      it("emits a Withdraw event", async () => {
        const log = result.logs[0];
        assert.equal(log.event, "Withdraw");
        const event = log.args;
        assert.equal(event.token, ETHER_ADDRESS, "token address is correct");
        assert.equal(event.user, user1, "user address is correct");
        assert.equal(
          event.amount.toString(),
          amount.toString(),
          "amount is correct"
        );
        assert.equal(event.balance.toString(), "0", "balance is correct");
      });
    });

    describe("failure", async () => {
      it("rejects withdraws for insufficient balances", async () => {
        await exchange
          .withdrawEther(tokens(100), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("depositing tokens", () => {
    let result;
    let amount;

    describe("success", () => {
      beforeEach(async () => {
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });
      it("tracks the token deposit", async () => {
        // Check exchange token balance
        let balance;
        balance = await token.balanceOf(exchange.address);
        assert.equal(balance.toString(), amount.toString());

        // Check tokens on exchange
        balance = await exchange.tokens(token.address, user1);
        assert.equal(balance.toString(), amount.toString());
      });

      it("emits a Deposit event", async () => {
        const log = result.logs[0];
        assert.equal(log.event, "Deposit");
        const event = log.args;
        assert.equal(event.token, token.address, "token address is correct");
        assert.equal(event.user, user1, "user address is correct");
        assert.equal(
          event.amount.toString(),
          amount.toString(),
          "amount is correct"
        );
        assert.equal(
          event.balance.toString(),
          amount.toString(),
          "balance is correct"
        );
      });
    });
    describe("failure", () => {
      it("rejects Ether deposits", async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, tokens(10), {
            from: user1,
          })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it("fails when no tokens are approved", async () => {
        await exchange
          .depositToken(token.address, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe("withdrawing tokens", async () => {
    let result;
    let amount;

    describe("success", async () => {
      beforeEach(async () => {
        // Deposit tokens first
        amount = tokens(10);
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, { from: user1 });

        // Withdraw tokens
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        });
      });

      it("withdraws token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        assert.equal(balance.toString(), "0");
      });

      it("emits a Withdraw event", async () => {
        const log = result.logs[0];
        assert.equal(log.event, "Withdraw");
        const event = log.args;
        assert.equal(event.token, token.address, "token address is correct");
        assert.equal(event.user, user1, "user address is correct");
        assert.equal(
          event.amount.toString(),
          amount.toString(),
          "amount is correct"
        );
        assert.equal(event.balance.toString(), "0", "balance is correct");
      });
    });

    describe("failure", () => {
      it("rejects Ether withdraws", async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it("fails for insufficient balances", async () => {
        await exchange
          .withdrawToken(token.address, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
    describe("checking balance", async () => {
      beforeEach(async () => {
        exchange.depositEther({ from: user1, value: tokens(1) });
      });

      it("returns user balance", async () => {
        const result = await exchange.balanceOf(ETHER_ADDRESS, user1);
        assert.equal(result.toString(), tokens(1).toString());
      });
    });
  });

  describe("making orders", async () => {
    let result;

    beforeEach(async () => {
      result = await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        tokens(1),
        { from: user1 }
      );
    });

    it("tracks the newly created order", async () => {
      const orderCount = await exchange.orderCount();
      assert.equal(orderCount.toString(), "1");
      const order = await exchange.orders("1");
      assert.equal(order.id.toString(), "1", "id is correct");
      assert.equal(order.user, user1, "user is correct");
      assert.equal(order.tokenGet, token.address, "tokenGet is correct");
      assert.equal(
        order.amountGet.toString(),
        tokens(1).toString(),
        "amountGet is correct"
      );
      assert.equal(order.tokenGive, ETHER_ADDRESS, "tokenGive is correct");
      assert.equal(
        order.amountGive.toString(),
        tokens(1).toString(),
        "amountGive is correct"
      );
      order.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is present");
    });

    it("emits an Order event", async () => {
      const log = result.logs[0];
      assert.equal(log.event, "Order");
      const event = log.args;
      assert.equal(event.id.toString(), "1", "id is correct");
      assert.equal(event.user, user1, "user address is correct");
      assert.equal(event.tokenGet, token.address, "tokenGet is correct");
      assert.equal(
        event.amountGet.toString(),
        tokens(1).toString(),
        "amountGet is correct"
      );
      assert.equal(event.tokenGive, ETHER_ADDRESS, "tokenGive is correct");
      assert.equal(
        event.amountGive.toString(),
        tokens(1).toString(),
        "amountGive is correct"
      );
      event.timestamp
        .toString()
        .length.should.be.at.least(1, "timestamp is present");
    });
  });

  describe("order actions", async () => {
    beforeEach(async () => {
      // User 1 deposits ether
      await exchange.depositEther({ from: user1, value: tokens(1) });

      // give token to user2
      await token.transfer(user2, tokens(100), { from: deployer });

      // user2 deposits tokens only
      await token.approve(exchange.address, tokens(2), { from: user2 });
      await exchange.depositToken(token.address, tokens(2), { from: user2 });

      // user 1 makes an order to buy tokens with ether
      await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        tokens(1),
        { from: user1 }
      );
    });

    describe("filling orders", async () => {
      let result;

      describe("success", async () => {
        beforeEach(async () => {
          // user2 fills order
          result = await exchange.fillOrder("1", { from: user2 });
        });

        it("executes the trades and charges fees", async () => {
          let balance;
          balance = await exchange.balanceOf(token.address, user1);
          assert.equal(
            balance.toString(),
            tokens(1).toString(),
            "user1 received tokens"
          );
          balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
          assert.equal(balance.toString(), tokens(1), "user2 received Ether");
          balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
          assert.equal(balance.toString(), "0", "user1 Ether deducted");
          balance = await exchange.balanceOf(token.address, user2);
          assert.equal(
            balance.toString(),
            tokens(0.99).toString(),
            "user2 tokens deducted with fee applied"
          );
          const feeAccount = await exchange.feeAccount();
          balance = await exchange.balanceOf(token.address, feeAccount);
          assert.equal(
            balance.toString(),
            tokens(0.01).toString(),
            "feeAccount received fee"
          );
        });

        it("updates filled orders", async () => {
          const orderFilled = await exchange.orderFilled(1);
          assert.equal(orderFilled, true);
        });

        it("emits an Trade event", async () => {
          const log = result.logs[0];
          assert.equal(log.event, "Trade");
          const event = log.args;
          assert.equal(event.id.toString(), "1", "id is correct");
          assert.equal(event.user, user1, "user address is correct");
          assert.equal(event.tokenGet, token.address, "tokenGet is correct");
          assert.equal(
            event.amountGet.toString(),
            tokens(1).toString(),
            "amountGet is correct"
          );
          assert.equal(event.tokenGive, ETHER_ADDRESS, "tokenGive is correct");
          assert.equal(
            event.amountGive.toString(),
            tokens(1).toString(),
            "amountGive is correct"
          );
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is present");
        });
      });

      describe("failure", async () => {
        it("rejectes invalid order ids", async () => {
          const invalidOrderId = 99999;
          await exchange
            .fillOrder(invalidOrderId, { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects already filled orders", async () => {
          await exchange.fillOrder("1", { from: user2 }).should.be.fulfilled;

          await exchange
            .fillOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects cancelled orders", async () => {
          await exchange.cancelOrder("1", { from: user1 }).should.be.fulfilled;

          await exchange
            .fillOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });

    describe("cancelling orders", async () => {
      let result;

      describe("success", async () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder("1", { from: user1 });
        });

        it("updates cancelled orders", async () => {
          const orderCancelled = await exchange.orderCancelled(1);
          assert.equal(orderCancelled, true);
        });

        it("emits an Cancel event", async () => {
          const log = result.logs[0];
          assert.equal(log.event, "Cancel");
          const event = log.args;
          assert.equal(event.id.toString(), "1", "id is correct");
          assert.equal(event.user, user1, "user address is correct");
          assert.equal(event.tokenGet, token.address, "tokenGet is correct");
          assert.equal(
            event.amountGet.toString(),
            tokens(1).toString(),
            "amountGet is correct"
          );
          assert.equal(event.tokenGive, ETHER_ADDRESS, "tokenGive is correct");
          assert.equal(
            event.amountGive.toString(),
            tokens(1).toString(),
            "amountGive is correct"
          );
          event.timestamp
            .toString()
            .length.should.be.at.least(1, "timestamp is present");
        });
      });

      describe("failure", async () => {
        it("rejects invalid order ids", async () => {
          const invalidOrderId = 99999;
          await exchange
            .cancelOrder(invalidOrderId, { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it("rejects unauthorized cancelation", async () => {
          await exchange
            .cancelOrder("1", { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });
  });
});
