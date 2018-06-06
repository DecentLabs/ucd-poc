import store from "modules/store";
import SolidityContract from "modules/ethereum/SolidityContract";
import TokenAEur from "abiniser/abis/TokenAEur_ABI_9aa81519ec45a52d3f8f1a1a83d25c74.json";
import Rates from "abiniser/abis/Rates_ABI_73a17ebb0acc71773371c6a8e1c8e6ce.json";
import LockManager from "abiniser/abis/Locker_ABI_619ff7809b73aead28176fe6317953c3.json";
import LoanManager from "abiniser/abis/LoanManager_ABI_ec709c3341045caa3a75374b8cfc7286.json";
import Exchange from "abiniser/abis/Exchange_ABI_b2a23202a9a0f04755a186896c2b56eb.json";
import StabilityBoardProxy from "abiniser/abis/StabilityBoardProxy_ABI_19ab69b650e28b2dd211d3851893f91f.json";

export const CONTRACTS_CONNECT_REQUESTED = "contracts/CONTRACTS_CONNECT_REQUESTED";
export const CONTRACTS_CONNECT_SUCCESS = "contracts/CONTRACTS_CONNECT_SUCCESS";
export const CONTRACTS_CONNECT_ERROR = "contracts/CONTRACTS_CONNECT_ERROR";

const initialState = {
    latest: {
        augmintToken: null,
        feeAccount: null,
        rates: null,
        monetarySupervisor: null,
        loanManager: null,
        lockManager: null,
        exchange: null,
        stabilityBoardProxy: null
    },
    error: null,
    isLoading: false,
    isConnected: false
};

export default (state = initialState, action) => {
    switch (action.type) {
        case CONTRACTS_CONNECT_REQUESTED:
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case CONTRACTS_CONNECT_SUCCESS:
            return {
                ...state,
                latest: action.contracts,
                isLoading: false,
                isConnected: true,
                error: null
            };

        case CONTRACTS_CONNECT_ERROR:
            return {
                ...state,
                isLoading: false,
                isConnected: false,
                error: action.error
            };

        default:
            return state;
    }
};

export const connectContracts = () => {
    return async dispatch => {
        dispatch({
            type: CONTRACTS_CONNECT_REQUESTED
        });
        try {
            const web3 = store.getState().web3Connect;
            const augmintToken = SolidityContract.connectLatest(web3, TokenAEur);
            const rates = SolidityContract.connectLatest(web3, Rates);
            const lockManager = SolidityContract.connectLatest(web3, LockManager);
            const loanManager = SolidityContract.connectLatest(web3, LoanManager);
            const exchange = SolidityContract.connectLatest(web3, Exchange);
            const stabilityBoardProxy = SolidityContract.connectLatest(web3, StabilityBoardProxy);

            const [feeAccountAddress, lockManagerMonetarySupervisorAddress] = await Promise.all([
                augmintToken.web3ContractInstance.methods.feeAccount().call(),
                lockManager.web3ContractInstance.methods.monetarySupervisor().call()
            ]);

            const feeAccount = SolidityContract.connectAt(
                store.getState().web3Connect,
                "FeeAccount",
                feeAccountAddress
            );
            const monetarySupervisor = SolidityContract.connectAt(
                web3,
                "MonetarySupervisor",
                lockManagerMonetarySupervisorAddress
            );

            const contracts = {
                augmintToken,
                rates,
                feeAccount,
                monetarySupervisor,
                lockManager,
                loanManager,
                exchange,
                stabilityBoardProxy
            };

            return dispatch({
                type: CONTRACTS_CONNECT_SUCCESS,
                contracts
            });
        } catch (error) {
            return dispatch({
                type: CONTRACTS_CONNECT_ERROR,
                error: error
            });
        }
    };
};
