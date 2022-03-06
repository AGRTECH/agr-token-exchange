import { tokens } from "./helpers";

const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Token", ([deployer, receiver, exchange]) => {
  let token;

  beforeEach(async () => {
    token = await Token.new();
  });

  describe("deployment", () => {
    it("tracks the name", async () => {
      // Test for token name
      const name = await token.name();
      assert.equal(name, "AGR Token");
    });
    it("tracks the symbol", async () => {
      const symbol = await token.symbol();
      assert.equal(symbol, "AGR");
    });
    it("tracks the decimals", async () => {
      const decimals = await token.decimals();
      assert.equal(decimals, 18);
    });
    it("tracks the supply", async () => {
      const supply = await token.totalSupply();
      assert.equal(supply.toString(), "1000000000000000000000000");
    });
    it("assigns total supply", async () => {
      const balance = await token.balanceOf(deployer);
      assert.equal(balance.toString(), "1000000000000000000000000");
    });
  });

  describe("sending tokens", () => {
    describe("success", async () => {
      it("transfers token balances", async () => {
        let balanceOf;

        // Before transfer
        balanceOf = await token.balanceOf(deployer);
        assert.equal(balanceOf.toString(), tokens(1000000));
        balanceOf = await token.balanceOf(receiver);
        assert.equal(balanceOf.toString(), tokens(0));

        // Transfer
        await token.transfer(receiver, tokens(100), {
          from: deployer,
        });

        // After transfer
        balanceOf = await token.balanceOf(deployer);
        assert.equal(balanceOf.toString(), tokens(999900));
        balanceOf = await token.balanceOf(receiver);
        assert.equal(balanceOf.toString(), tokens(100));
      });

      it("emits a transfer event", async () => {
        let result = await token.transfer(receiver, tokens(100), {
          from: deployer,
        });
        const log = result.logs[0];
        assert.equal(log.event, "Transfer");
        const event = log.args;
        assert.equal(event.from.toString(), deployer, "from is correct");
        assert.equal(event.to.toString(), receiver, "to is correct");
        assert.equal(event.value.toString(), tokens(100), "value is correct");
      });
    });
    describe("failure", async () => {
      it("rejects insufficient balance", async () => {
        let invalidAmount;
        invalidAmount = tokens(1000000000);
        await token
          .transfer(receiver, invalidAmount, { from: deployer })
          .should.be.rejectedWith(
            "VM Exception while processing transaction: revert"
          );
        invalidAmount = tokens(10);
        await token
          .transfer(deployer, invalidAmount, { from: receiver })
          .should.be.rejectedWith(
            "VM Exception while processing transaction: revert"
          );
      });
      it("rejects invalid recipients", async () => {
        await token.transfer(0x0, tokens(100), { from: deployer }).should.be
          .rejected;
      });
    });
  });

  describe("approving tokens", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.approve(exchange, amount, { from: deployer });
    });

    describe("success", () => {
      it("allocates an allowance for delagated token spending", async () => {
        const allowance = await token.allowance(deployer, exchange);
        assert.equal(allowance.toString(), amount.toString());
      });

      it("emits an Approval event", async () => {
        const log = result.logs[0];
        assert.equal(log.event, "Approval");
        const event = log.args;
        assert.equal(event.owner.toString(), deployer, "owner is correct");
        assert.equal(event.spender.toString(), exchange, "spender is correct");
        assert.equal(event.value.toString(), tokens(100), "value is correct");
      });
    });

    describe("failure", () => {
      it("rejects invalid spenders", async () => {
        await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
      });
    });
  });
  describe("delegated token transfers", () => {
    let result;
    beforeEach(async () => {
      await token.approve(exchange, tokens(100), { from: deployer });
    });

    describe("success", async () => {
      beforeEach(async () => {
        result = await token.transferFrom(deployer, receiver, tokens(100), {
          from: exchange,
        });
      });
      it("transfers token balances", async () => {
        let balanceOf;

        // After transfer
        balanceOf = await token.balanceOf(deployer);
        assert.equal(balanceOf.toString(), tokens(999900));
        balanceOf = await token.balanceOf(receiver);
        assert.equal(balanceOf.toString(), tokens(100));
      });

      it("resets the allowance", async () => {
        const allowance = await token.allowance(deployer, exchange);
        assert.equal(allowance.toString(), "0");
      });

      it("emits a transfer event", async () => {
        let result = await token.transfer(receiver, tokens(100), {
          from: deployer,
        });
        const log = result.logs[0];
        assert.equal(log.event, "Transfer");
        const event = log.args;
        assert.equal(event.from.toString(), deployer, "from is correct");
        assert.equal(event.to.toString(), receiver, "to is correct");
        assert.equal(event.value.toString(), tokens(100), "value is correct");
      });
    });
    describe("failure", async () => {
      it("rejects insufficient balance", async () => {
        let invalidAmount;
        invalidAmount = tokens(1000000000);
        await token
          .transferFrom(deployer, receiver, invalidAmount, { from: exchange })
          .should.be.rejectedWith(
            "VM Exception while processing transaction: revert"
          );
      });

      it("rejects invalid recipients", async () => {
        await token.transferFrom(deployer, 0x0, tokens(100), { from: exchange })
          .should.be.rejected;
      });
    });
  });
});
