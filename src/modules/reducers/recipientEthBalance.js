import store from "modules/store";

export const RECIPIENT_ETH_BALANCE_REQUESTED = "recipientEthBalance/ETH_BALANCE_REQUESTED";
export const RECIPIENT_ETH_BALANCE_RECEIVED = "recipientEthBalance/ETH_BALANCE_RECEIVED";
export const RECIPIENT_ETH_BALANCE_ERROR = "recipientEthBalance/ETH_BALANCE_ERROR";

const initialState = {
    isLoading: false,
    isLoaded: false,
    error: null,
    recipientAccount: {
        address: "?",
        ethBalance: "?",
        bn_ethBalance: null
    }
};

export default (state = initialState, action) => {
    switch (action.type) {
        case RECIPIENT_ETH_BALANCE_REQUESTED:
            return {
                ...state,
                isLoading: true,
                recipientAccount: action.address
            };

        case RECIPIENT_ETH_BALANCE_RECEIVED:
            return {
                ...state,
                isLoading: false,
                isLoaded: true,
                recipientAccount: action.recipientAccount
            };
        case RECIPIENT_ETH_BALANCE_ERROR:
            return {
                ...state,
                isLoading: false,
                error: action.error
            };

        default:
            return state;
    }
};

export const refreshRecipientsEthBalance = recipientAddress => {
    return async dispatch => {
        dispatch({
            type: RECIPIENT_ETH_BALANCE_REQUESTED,
            address: recipientAddress
        });
        try {
            const recipientAccount = await getRecipientsEthBalance(recipientAddress);

            return dispatch({ type: RECIPIENT_ETH_BALANCE_RECEIVED, recipientAccount });
        } catch (error) {
            if (process.env.NODE_ENV !== "production") {
                return Promise.reject(error);
            }
            return dispatch({ type: RECIPIENT_ETH_BALANCE_ERROR, error });
        }
    };
};

async function getRecipientsEthBalance(recipientAddress) {
    const web3 = store.getState().web3Connect.web3Instance;

    const bn_weiBalance = await Promise(web3.eth.getBalance(recipientAddress._address));

    return {
        bn_ethBalance: bn_weiBalance,
        ethBalance: web3.utils.fromWei(bn_weiBalance)
    };
}
