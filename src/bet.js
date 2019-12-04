const sdk = require('./sdk');
const validate = require('./validate');
const { sendData, sendError } = require('./response');
const BET_RATE = 3;

// this game is yours!
async function bet({ betAmount, paymentAddress, betDiceNumber }) {
  const betDiceNumberResult = Math.round(Math.random() * 5) + 1; // [1..6]
  const isWin = betDiceNumberResult === betDiceNumber;
  return isWin ? await handleWin({ betAmount, paymentAddress, betDiceNumber, betDiceNumberResult }) : handleLose({ betAmount, paymentAddress, betDiceNumber, betDiceNumberResult });
}

// user lose
function handleLose({ betAmount, paymentAddress, betDiceNumber, betDiceNumberResult }) {
  console.debug(`${paymentAddress} losed ${betAmount}, bet: ${betDiceNumber}, result: ${betDiceNumberResult}`);

  return { lose: betAmount, betDiceNumberResult } ;
}

// user win
async function handleWin({ betAmount, paymentAddress, betDiceNumber, betDiceNumberResult }) {

  const winAmount = betAmount * BET_RATE;

  // server has to send token (as a prize) to the user
  const tx = await sdk.handleSend({
    paymentAddress,
    amount: winAmount
  });

  console.debug(`${paymentAddress} won ${winAmount}, bet: ${betDiceNumber}, result: ${betDiceNumberResult}. TxID: ${tx.txId}`);


  return { win: winAmount, betDiceNumberResult, message: `You will receive ${winAmount} nano PRV in a couple minutes`, txId: tx.txId } ;
}

async function handleBetRequest(req, res) {
  try {
    const payload = req.body;

    // payload should include "betAmount" and "paymentAddress"
    // betAmount is amount user bet
    // paymentAddress is user's incognito address, you need it to send token (win prize) to the user
    if (!validate.isValidPayload(payload)) {
      throw new Error('Invalid params');
    }

    const { betAmount, paymentAddress, betDiceNumber, txId } = payload;

    // verify tx
    await sdk.checkTx(txId);
  
    const rs = await bet({ betAmount, paymentAddress, betDiceNumber });
    sendData(res, rs);
  } catch (e) {
    sendError(res, e.message);
  }
}

module.exports = handleBetRequest;