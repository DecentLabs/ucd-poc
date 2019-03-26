/*
 A-EUR transfer ethereum functions
Use only from reducers.

    TODO: tune default gasPrice
    TODO: clean up thrown errors
    TODO: set gasEstimates when it gas consumption has settled.
 */
import store from "modules/store";
import moment from "moment";
import { cost } from "./gas";
import { processTx } from "modules/ethereum/ethHelper";
import { DECIMALS_DIV } from "utils/constants";

export function getTransferFee(amount) {
    const { feePt, feeMin, feeMax } = store.getState().augmintToken.info;
    let fee = Math.round(amount * feePt * DECIMALS_DIV) / DECIMALS_DIV;
    if (fee < feeMin) {
        fee = feeMin;
    } else if (fee > feeMax) {
        fee = feeMax;
    }
    return fee;
}

export function getMaxTransfer(amount) {
    const { feePt, feeMin, feeMax } = store.getState().augmintToken.info;

    const minLimit = Math.floor(feeMin / feePt);
    const maxLimit = Math.floor(feeMax / feePt);

    let maxAmount;
    if (amount < minLimit) {
        maxAmount = amount - feeMin;
    } else if (amount >= maxLimit) {
        // TODO: fix this on edge cases, https://github.com/Augmint/augmint-web/issues/60
        maxAmount = amount - feeMax;
    } else {
        maxAmount = Math.round((amount / (feePt + 1)) * DECIMALS_DIV) / DECIMALS_DIV;
    }

    return maxAmount;
}

export async function transferTokenTx(payload) {
    const { payee, tokenAmount, narrative } = payload;

    const gasEstimate = cost.TRANSFER_AUGMINT_TOKEN_GAS;
    const userAccount = store.getState().web3Connect.userAccount;
    const augmintToken = store.getState().contracts.latest.augmintToken.web3ContractInstance;

    const _narrative = narrative == null || payload.narrative.trim() === "" ? null : payload.narrative.trim();
    const amount = (tokenAmount * DECIMALS_DIV).toFixed(0);

    let tx;
    let txName;
    if (_narrative) {
        txName = "A-EUR transfer (with narrative)";
        tx = augmintToken.methods.transferWithNarrative(payee, amount, _narrative).send({
            from: userAccount,
            gas: gasEstimate
        });
    } else {
        txName = "A-EUR transfer";
        tx = augmintToken.methods.transfer(payee, amount).send({
            from: userAccount,
            gas: gasEstimate
        });
    }

    const transactionHash = await processTx(tx, txName, gasEstimate, null, payload);
    return { txName, transactionHash };
}

export async function transferTokenDelegatedTx(payload, signature) {
    const { from, to, amount, narrative, maxExecutorFee, nonce } = payload;
    const gasEstimate = cost.DELEGATED_TRANSFER_AUGMINT_TOKEN_GAS;
    const userAccount = store.getState().web3Connect.userAccount;
    const augmintToken = store.getState().contracts.latest.augmintToken.web3ContractInstance;

    const tx = augmintToken.methods
        .delegatedTransfer(from, to, amount, narrative, maxExecutorFee, nonce, signature, maxExecutorFee)
        .send({
            from: userAccount,
            gas: gasEstimate
        });
    const txName = "A-EUR delegated transfer";
    const transactionHash = await processTx(tx, txName, gasEstimate, null, {
        payee: to,
        tokenAmount: amount,
        narrative
    });

    return { txName, transactionHash };
}

async function getBlockTimestamp(txData, web3) {
    let blockData;
    if (typeof txData.getBlock === "function") {
        // called from event - need to use this.getBlock b/c block is available on Infura later than than tx receipt (Infura  node syncing)
        blockData = await txData.getBlock();
    } else {
        // not from event, web3.getBlock  works
        blockData = await web3.eth.getBlock(txData.blockNumber);
    }

    const blockTimeStampText = blockData ? moment.unix(await blockData.timestamp).format("D MMM YYYY HH:mm") : "?";
    txData.blockData = blockData;
    txData.blockTimeStampText = blockTimeStampText;
    return txData;
}

export async function fetchTransfersTx(account, fromBlock, toBlock) {
    try {
        const augmintToken = store.getState().contracts.latest.augmintToken.web3ContractInstance;
        const web3 = store.getState().web3Connect.web3Instance;

        const [logsFrom, logsTo] = await Promise.all([
            augmintToken.getPastEvents("AugmintTransfer", { filter: { from: account }, fromBlock, toBlock }),
            augmintToken.getPastEvents("AugmintTransfer", { filter: { to: account }, fromBlock, toBlock })
        ]);

        const logs = await Promise.all([...logsFrom, ...logsTo].map(async logData => getBlockTimestamp(logData, web3)));

        return processTransfersTx(logs, account);
    } catch (error) {
        throw new Error("fetchTransferList failed.\n" + error);
    }
}

export function processTransfersTx(logs, account) {
    let transfers = logs.map(logData => _formatTransferLog(account, logData, logData.returnValues));
    transfers = Array.from(new Set(aggregateSameHashes(transfers)));
    transfers.sort((a, b) => b.blockNumber - a.blockNumber);
    return transfers;
}

// called from augminTokenProvider, arguments are in ethers event listener format
export async function processNewTransferTx(account, eventObject) {
    const web3 = store.getState().web3Connect.web3Instance;
    eventObject = await getBlockTimestamp(eventObject, web3);
    return _formatTransferLog(account, eventObject, eventObject.args);
}

const DELEGATED_NARRATIVE = "Delegated transfer fee";

// get txData in format of logData returned from web3.getPastEvents or with eventObject passed by ethers event listener
function _formatTransferLog(account, txData, args) {
    const logData = Object.assign({ args }, txData, {
        from: args.from.toLowerCase(),
        to: args.to.toLowerCase(),
        fee: args.fee * -1,
        amount: args.amount * 1,
        narrative: args.narrative,
        key: `${txData.transactionHash}-${txData.transactionIndex}`
    });

    if (logData.to === account.toLowerCase()) {
        logData.fee = 0;
        if (logData.from === account.toLowerCase()) {
            logData.amount = 0;
        }
    }

    logData.direction = account.toLowerCase() === logData.from ? -1 : 1;
    logData.amount = logData.amount * logData.direction;

    return logData;
}

function aggregateDelegationFees(logs) {
    logs.sort((a, b) => b.amount - a.amount);
    let primaryIndex = -1;
    logs.some((element, index) => {
        if (element.narrative !== DELEGATED_NARRATIVE) {
            primaryIndex = index;
            return true;
        }
        return false;
    });
    if (primaryIndex > -1) {
        const primary = logs.splice(primaryIndex, 1)[0];
        logs.forEach(log => {
            primary.fee += log.fee;
            primary.fee += log.amount;
        });
        return [primary];
    } else {
        return logs;
    }
}

export function aggregateSameHashes(transfers) {
    const aggregator = new Map();
    const order = [];
    transfers.forEach(log => {
        const key = log.key;
        let elem = aggregator.get(key);
        if (!elem) {
            elem = [];
            order.push(key);
        }
        elem.push(log);
        aggregator.set(key, elem);
    });

    return order.reduce((acc, key) => {
        const values = aggregator.get(key);
        if (values.some(value => value.narrative === DELEGATED_NARRATIVE)) {
            return acc.concat(aggregateDelegationFees(values));
        } else {
            return acc.concat(values);
        }
    }, []);
}

export function calculateTransfersBalance(transfers, currentBalance = 0) {
    return transfers.reduce((balance, tx, index, all) => {
        const amount = index > 0 ? all[index - 1].amount : 0;
        const fee = index > 0 ? all[index - 1].fee : 0;
        tx.balance = balance - amount - fee;
        return tx.balance;
    }, currentBalance);
}
