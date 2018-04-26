/*
    TODO: separate transfer from here to tackle isLoading race conditions
*/
import store from "modules/store";
import SolidityContract from "modules/ethereum/SolidityContract";
import MonetarySupervisor from "abiniser/abis/MonetarySupervisor_ABI_a552ee1f90ae83cb91d07311ae8eab1e.json";

import { ONE_ETH_IN_WEI } from "utils/constants";

export const MONETARY_SUPERVISOR_CONNECT_REQUESTED = "augmintToken/MONETARY_SUPERVISOR_CONNECT_REQUESTED";
export const MONETARY_SUPERVISOR_CONNECT_SUCCESS = "augmintToken/MONETARY_SUPERVISOR_CONNECT_SUCCESS";
export const MONETARY_SUPERVISOR_CONNECT_ERROR = "augmintToken/MONETARY_SUPERVISOR_CONNECT_ERROR";

export const MONETARY_SUPERVISOR_REFRESH_REQUESTED = "augmintToken/MONETARY_SUPERVISOR_REFRESH_REQUESTED";
export const MONETARY_SUPERVISOR_REFRESHED = "augmintToken/MONETARY_SUPERVISOR_REFRESHED";

const initialState = {
    contract: null,
    isLoading: false,
    isConnected: false,
    error: null,
    connectionError: null,
    info: {
        augmintToken: null,
        interestEarnedAccount: null,
        augmintReserves: null,

        issuedByMonetaryBoard: "?",

        totalLoanAmount: "?",
        totalLockedAmount: "?",
        ltdPercent: "?",

        ltdLoanDifferenceLimit: "?",
        ltdLockDifferenceLimit: "?",
        allowedLtdDifferenceAmount: "?",

        maxLoanByLtd: "?",
        maxLockByLtd: "?",

        reserveEthBalance: "?",
        bn_reserveWeiBalance: null,

        reserveTokenBalance: "?",

        interestEarnedAccountTokenBalance: "?"
    }
};

export default (state = initialState, action) => {
    switch (action.type) {
        case MONETARY_SUPERVISOR_CONNECT_REQUESTED:
            return {
                ...state,
                isLoading: true,
                connectionError: null,
                error: null
            };

        case MONETARY_SUPERVISOR_CONNECT_SUCCESS:
            return {
                ...state,
                isLoading: false,
                isConnected: true,
                error: null,
                connectionError: null,
                contract: action.contract,
                info: action.info
            };

        case MONETARY_SUPERVISOR_CONNECT_ERROR:
            return {
                ...state,
                isLoading: false,
                isConnected: false,
                connectionError: action.error
            };

        case MONETARY_SUPERVISOR_REFRESH_REQUESTED:
            return {
                ...state,
                isLoading: true
            };

        case MONETARY_SUPERVISOR_REFRESHED:
            return {
                ...state,
                isLoading: false,
                info: action.result
            };

        default:
            return state;
    }
};

export const connectMonetarySupervisor = () => {
    return async dispatch => {
        dispatch({
            type: MONETARY_SUPERVISOR_CONNECT_REQUESTED
        });

        try {
            const contract = SolidityContract.connectLatest(store.getState().web3Connect, MonetarySupervisor);
            const info = await getMonetarySupervisorInfo(contract.web3ContractInstance);
            return dispatch({
                type: MONETARY_SUPERVISOR_CONNECT_SUCCESS,
                contract: contract,
                info: info
            });
        } catch (error) {
            if (process.env.NODE_ENV !== "production") {
                return Promise.reject(error);
            }
            return dispatch({
                type: MONETARY_SUPERVISOR_CONNECT_ERROR,
                error: error
            });
        }
    };
};

export const refreshMonetarySupervisor = () => {
    return async dispatch => {
        dispatch({
            type: MONETARY_SUPERVISOR_REFRESH_REQUESTED
        });
        const monetarySupervisorInstance = store.getState().monetarySupervisor.contract.web3ContractInstance;
        const info = await getMonetarySupervisorInfo(monetarySupervisorInstance);
        return dispatch({
            type: MONETARY_SUPERVISOR_REFRESHED,
            result: info
        });
    };
};

async function getMonetarySupervisorInfo(monetarySupervisorInstance) {
    const web3 = store.getState().web3Connect.web3Instance;
    const augmintTokenInstance = store.getState().augmintToken.contract.web3ContractInstance;
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;

    const [
        augmintTokenAddress,
        interestEarnedAccountAddress,
        augmintReservesAddress,

        bn_issuedByMonetaryBoard,

        bn_totalLoanAmount,
        bn_totalLockedAmount,

        ltdParams,

        bn_maxLockByLtd,
        bn_maxLoanByLtd
    ] = await Promise.all([
        monetarySupervisorInstance.methods.augmintToken().call(),
        monetarySupervisorInstance.methods.interestEarnedAccount().call(),
        monetarySupervisorInstance.methods.augmintReserves().call(),

        monetarySupervisorInstance.methods.issuedByMonetaryBoard().call(),

        monetarySupervisorInstance.methods.totalLoanAmount().call(),
        monetarySupervisorInstance.methods.totalLockedAmount().call(),

        monetarySupervisorInstance.methods.ltdParams().call(),

        monetarySupervisorInstance.methods.getMaxLockAmountAllowedByLtd().call(),
        monetarySupervisorInstance.methods.getMaxLoanAmountAllowedByLtd().call()
    ]);

    const issuedByMonetaryBoard = bn_issuedByMonetaryBoard / decimalsDiv;
    const totalLoanAmount = bn_totalLoanAmount / decimalsDiv;
    const totalLockedAmount = bn_totalLockedAmount / decimalsDiv;

    const ltdPercent = totalLockedAmount === 0 ? 0 : totalLoanAmount / totalLockedAmount;

    const ltdLockDifferenceLimit = ltdParams.lockDifferenceLimit / 1000000;
    const ltdLoanDifferenceLimit = ltdParams.loanDifferenceLimit / 1000000;
    const allowedLtdDifferenceAmount = ltdParams.allowedDifferenceAmount / decimalsDiv;

    const maxLockByLtd = bn_maxLockByLtd / decimalsDiv;
    const maxLoanByLtd = bn_maxLoanByLtd / decimalsDiv;

    const [bn_reserveWeiBalance, bn_reserveTokenBalance, bn_interestEarnedAccountTokenBalance] = await Promise.all([
        web3.eth.getBalance(augmintReservesAddress),
        augmintTokenInstance.methods.balanceOf(augmintReservesAddress).call(),
        augmintTokenInstance.methods.balanceOf(interestEarnedAccountAddress).call()
    ]);

    const reserveEthBalance = bn_reserveWeiBalance / ONE_ETH_IN_WEI;
    const reserveTokenBalance = bn_reserveTokenBalance / decimalsDiv;
    const interestEarnedAccountTokenBalance = bn_interestEarnedAccountTokenBalance / decimalsDiv;

    return {
        augmintToken: augmintTokenAddress,
        interestEarnedAccount: interestEarnedAccountAddress,
        augmintReserves: augmintReservesAddress,

        issuedByMonetaryBoard,
        totalLoanAmount,
        totalLockedAmount,
        ltdPercent,

        ltdLockDifferenceLimit,
        ltdLoanDifferenceLimit,
        allowedLtdDifferenceAmount,

        maxLockByLtd,
        maxLoanByLtd,

        reserveEthBalance,
        bn_reserveWeiBalance,

        reserveTokenBalance,

        interestEarnedAccountTokenBalance
    };
}
