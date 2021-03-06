import React from "react";
import styled from "styled-components";
import { Ratio, Tokens, Wei } from "@augmint/js";
import { DECIMALS, ETH_DECIMALS } from "utils/constants";

const NoWrap = styled.span`
    white-space: nowrap;
`;

function isEmpty(n) {
    return n === undefined || n === null;
}

function signum(n) {
    // eslint-disable-next-line eqeqeq
    return isEmpty(n) ? "empty" : n == 0 ? "zero" : n > 0 ? "positive" : "negative";
}

function format(n, decimals, symbol) {
    const fmt = new Intl.NumberFormat("en", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return (
        <React.Fragment>
            {fmt.format(n)}
            <span className="symbol">{symbol}</span>
        </React.Fragment>
    );
}

/*
    amount: amount to display
    raw: set to true, if amount is an integer in the smallest unit of account
    decimals: defaults to token decimals
 */
export class AEUR extends React.Component {
    render() {
        const { amount, raw, className, decimals = DECIMALS, ...rest } = this.props;
        const amt = isEmpty(amount) ? null : raw || amount instanceof Tokens ? amount / Math.pow(10, DECIMALS) : amount;
        const cls = ["AEUR", className, signum(amt)].join(" ");
        return (
            <NoWrap className={cls} {...rest}>
                {amt !== null && format(amt, decimals, " A€")}
            </NoWrap>
        );
    }
}

export class Rate extends React.Component {
    render() {
        return (
            <React.Fragment>
                1 ETH = <AEUR {...this.props} />
            </React.Fragment>
        );
    }
}

/*
    amount: amount to display
    raw: set to true, if amount is an integer in the smallest unit of account (wei)
    decimals: defaults to ETH_DECIMALS
 */
export class ETH extends React.Component {
    render() {
        const { amount, raw, className, decimals = ETH_DECIMALS, ...rest } = this.props;
        const amt = isEmpty(amount) ? null : raw || amount instanceof Wei ? amount / Math.pow(10, 18) : amount;
        const cls = ["ETH", className, signum(amt)].join(" ");
        return (
            <NoWrap className={cls} {...rest}>
                {amt !== null && format(amt, decimals, " ETH")}
            </NoWrap>
        );
    }
}

/*
    amount: amount to display
    raw: set to true, if amount is an integer in the smallest unit of account (PPM)
    decimals: defaults to 2
 */
export class Percent extends React.Component {
    render() {
        const { amount, raw, className, decimals = 2, ...rest } = this.props;
        const amt = isEmpty(amount) ? null : raw || amount instanceof Ratio ? amount / Math.pow(10, 4) : amount * 100;
        const cls = ["Percent", className, signum(amt)].join(" ");
        return (
            <NoWrap className={cls} {...rest}>
                {amt !== null && format(amt, decimals, "%")}
            </NoWrap>
        );
    }
}
